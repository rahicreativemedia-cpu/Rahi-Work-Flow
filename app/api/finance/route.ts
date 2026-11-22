import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Invoice, PaymentRecord, ExpenseRecord } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const clientId = searchParams.get('clientId');
  const currency = searchParams.get('currency');

  const auth = getAuthenticatedUser(request, explicitUserId);
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access finance' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  if (user.status === 'inactive') {
    return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
  }

  // Employees and Clients are strictly blocked from internal finance
  if (!hasFullAdminAccess(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin or Manager permission required to access financial records' },
      { status: 403 }
    );
  }

  const db = getDB();
  let invoices = [...(db.invoices || [])];
  let payments = [...(db.payments || [])];
  let expenses = [...(db.expenses || [])];

  if (clientId) {
    invoices = invoices.filter((i) => i.clientId === clientId);
    payments = payments.filter((p) => p.clientId === clientId);
  }
  if (currency) {
    invoices = invoices.filter((i) => i.currency === currency);
    payments = payments.filter((p) => p.currency === currency);
    expenses = expenses.filter((e) => e.currency === currency);
  }

  // Multi-Currency Safe Totals (Strictly separated per currency)
  const revenueByCurrency: Record<string, { invoiced: number; collected: number; outstanding: number }> = {};

  for (const inv of invoices) {
    const cur = inv.currency || 'INR';
    if (!revenueByCurrency[cur]) {
      revenueByCurrency[cur] = { invoiced: 0, collected: 0, outstanding: 0 };
    }
    revenueByCurrency[cur].invoiced += inv.amount;
    revenueByCurrency[cur].collected += inv.paidAmount || 0;
    revenueByCurrency[cur].outstanding += Math.max(0, inv.amount - (inv.paidAmount || 0));
  }

  const expensesByCurrency: Record<string, number> = {};
  for (const exp of expenses) {
    const cur = exp.currency || 'INR';
    expensesByCurrency[cur] = (expensesByCurrency[cur] || 0) + exp.amount;
  }

  return NextResponse.json({
    invoices,
    payments,
    expenses,
    summary: {
      revenueByCurrency,
      expensesByCurrency,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId, ...payload } = body;

    const auth = getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
    }

    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required for financial actions' },
        { status: 403 }
      );
    }

    const db = getDB();
    db.invoices = db.invoices || [];
    db.payments = db.payments || [];
    db.expenses = db.expenses || [];

    // ACTION 1: CREATE INVOICE
    if (action === 'create_invoice') {
      const { clientId, amount, currency, dueDate, items, notes } = payload;
      const client = db.clients.find((c) => c.id === clientId);
      if (!client) {
        return NextResponse.json({ error: 'Invalid client reference' }, { status: 400 });
      }

      const invAmount = Number(amount);
      if (isNaN(invAmount) || invAmount <= 0) {
        return NextResponse.json({ error: 'Valid invoice amount is required' }, { status: 400 });
      }

      const invoice: Invoice = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(4, '0')}`,
        clientId: client.id,
        clientName: client.name,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: invAmount,
        currency: currency || client.currency || 'INR',
        status: 'sent',
        paidAmount: 0,
        items: Array.isArray(items) ? items : [{ description: 'Monthly Retainer Services', quantity: 1, unitPrice: invAmount, total: invAmount }],
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      db.invoices.unshift(invoice);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Invoice Created',
        details: `${caller.name} created invoice ${invoice.invoiceNumber} for ${client.name} (${invoice.currency} ${invoice.amount})`,
        targetType: 'client',
        targetId: client.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, invoice }, { status: 201 });
    }

    // ACTION 2: RECORD PAYMENT
    if (action === 'record_payment') {
      const { invoiceId, clientId, amount, currency, paymentMethod, transactionReference, notes } = payload;
      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
      }

      const invoice = invoiceId ? db.invoices.find((i) => i.id === invoiceId) : undefined;
      const client = clientId ? db.clients.find((c) => c.id === clientId) : (invoice ? db.clients.find((c) => c.id === invoice.clientId) : undefined);

      if (!client && !invoice) {
        return NextResponse.json({ error: 'Valid client or invoice reference is required' }, { status: 400 });
      }

      const clientName = client ? client.name : (invoice ? invoice.clientName : 'Client');
      const finalCurrency = currency || (invoice ? invoice.currency : (client ? client.currency : 'INR'));

      const payment: PaymentRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceId: invoice?.id,
        clientId: client?.id || invoice?.clientId || '',
        clientName,
        amount: payAmount,
        currency: finalCurrency,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'bank_transfer',
        transactionReference: transactionReference || `TXN-${Date.now()}`,
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      db.payments.unshift(payment);

      // Update invoice status if linked
      if (invoice) {
        invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
        if (invoice.paidAmount >= invoice.amount) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partially_paid';
        }
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Payment Recorded',
        details: `${caller.name} recorded payment of ${finalCurrency} ${payAmount} for ${clientName}`,
        targetType: 'client',
        targetId: client?.id || invoice?.clientId,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, payment, invoice });
    }

    // ACTION 3: RECORD EXPENSE
    if (action === 'record_expense') {
      const { title, category, amount, currency, notes } = payload;
      const expAmount = Number(amount);
      if (isNaN(expAmount) || expAmount <= 0) {
        return NextResponse.json({ error: 'Valid expense amount is required' }, { status: 400 });
      }

      const expense: ExpenseRecord = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: (title || 'Operational Expense').trim(),
        category: category || 'production',
        amount: expAmount,
        currency: currency || 'INR',
        date: new Date().toISOString().split('T')[0],
        recordedByUserId: caller.id,
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      db.expenses.unshift(expense);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Expense Recorded',
        details: `${caller.name} recorded expense "${expense.title}" (${expense.currency} ${expense.amount})`,
        targetType: 'settings',
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, expense }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid financial action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Financial action failed' }, { status: 500 });
  }
}
