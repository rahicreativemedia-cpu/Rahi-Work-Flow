import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  getPayments,
  createPayment,
  getExpenses,
  createExpense,
  getClientById,
  createAuditLog,
} from '@/lib/db';
import { Invoice, PaymentRecord, ExpenseRecord } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');
    const currency = searchParams.get('currency');

    const auth = await getAuthenticatedUser(request, explicitUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access finance',
        auth.status || 401
      );
    }

    const user = auth.user;
    if (user.status === 'inactive') {
      return privateErrorResponse('Forbidden: Account is inactive', 403);
    }

    // Employees and Clients are strictly blocked from internal finance
    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to access financial records',
        403
      );
    }

    const [allInvoices, allPayments, allExpenses] = await Promise.all([
      getInvoices(),
      getPayments(),
      getExpenses(),
    ]);

    let invoices = [...allInvoices];
    let payments = [...allPayments];
    let expenses = [...allExpenses];

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
    const revenueByCurrency: Record<
      string,
      { invoiced: number; collected: number; outstanding: number }
    > = {};

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

    return privateJsonResponse({
      invoices,
      payments,
      expenses,
      summary: {
        revenueByCurrency,
        expensesByCurrency,
      },
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve financial records', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId, ...payload } = body;

    const auth = await getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return privateErrorResponse('Forbidden: Account is inactive', 403);
    }

    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required for financial actions',
        403
      );
    }

    // ACTION 1: CREATE INVOICE
    if (action === 'create_invoice') {
      const { clientId, amount, currency, dueDate, items, notes } = payload;
      const client = await getClientById(clientId);
      if (!client) {
        return privateErrorResponse('Invalid client reference', 400);
      }

      const invAmount = Number(amount);
      if (isNaN(invAmount) || invAmount <= 0) {
        return privateErrorResponse('Valid invoice amount is required', 400);
      }

      const existingInvoices = await getInvoices();
      const invoice: Invoice = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(existingInvoices.length + 1).padStart(4, '0')}`,
        clientId: client.id,
        clientName: client.name,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate:
          dueDate ||
          new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: invAmount,
        currency: currency || client.currency || 'INR',
        status: 'sent',
        paidAmount: 0,
        items: Array.isArray(items)
          ? items
          : [
              {
                description: 'Monthly Retainer Services',
                quantity: 1,
                unitPrice: invAmount,
                total: invAmount,
              },
            ],
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      await createInvoice(invoice);

      await createAuditLog({
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

      return privateJsonResponse({ success: true, invoice }, { status: 201 });
    }

    // ACTION 2: RECORD PAYMENT
    if (action === 'record_payment') {
      const {
        invoiceId,
        clientId,
        amount,
        currency,
        paymentMethod,
        transactionReference,
        notes,
      } = payload;
      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return privateErrorResponse('Valid payment amount is required', 400);
      }

      const invoice = invoiceId ? await getInvoiceById(invoiceId) : null;
      const client = clientId
        ? await getClientById(clientId)
        : invoice
        ? await getClientById(invoice.clientId)
        : null;

      if (!client && !invoice) {
        return privateErrorResponse('Valid client or invoice reference is required', 400);
      }

      const clientName = client ? client.name : invoice ? invoice.clientName : 'Client';
      const finalCurrency =
        currency || (invoice ? invoice.currency : client ? client.currency : 'INR');

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

      await createPayment(payment);

      // Update invoice status if linked
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + payAmount;
        const newStatus =
          newPaidAmount >= invoice.amount ? 'paid' : 'partially_paid';

        await updateInvoice(invoice.id, {
          paidAmount: newPaidAmount,
          status: newStatus,
        });
      }

      await createAuditLog({
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

      return privateJsonResponse({ success: true, payment, invoice });
    }

    // ACTION 3: RECORD EXPENSE
    if (action === 'record_expense') {
      const { title, category, amount, currency, vendor, notes } = payload;
      const expAmount = Number(amount);
      if (isNaN(expAmount) || expAmount <= 0) {
        return privateErrorResponse('Valid expense amount is required', 400);
      }

      const expense: ExpenseRecord = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: (title || 'Operational Expense').trim(),
        category: category || 'production',
        amount: expAmount,
        currency: currency || 'INR',
        date: new Date().toISOString().split('T')[0],
        vendor: vendor || '',
        recordedByUserId: caller.id,
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      await createExpense(expense);

      await createAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Expense Recorded',
        details: `${caller.name} recorded expense "${expense.title}" (${expense.currency} ${expense.amount})`,
        targetType: 'settings',
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({ success: true, expense }, { status: 201 });
    }

    return privateErrorResponse('Invalid financial action', 400);
  } catch (error: any) {
    return privateErrorResponse('Financial action failed', 500, error);
  }
}
