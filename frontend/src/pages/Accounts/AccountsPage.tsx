import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Wallet, X } from 'lucide-react';
import { useAccounts, useCreatePayable, useRecordPayment } from '../../hooks/useFinance';
import { getErrorMessage } from '../../services/api';
import { downloadAccountsCsv } from '../../services/financeService';
import type {
  AccountRecord,
  AccountType,
  PaymentMethod,
} from '../../services/financeService';

const formatKes = (value: string | number): string =>
  `KES ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

const AccountsPage = () => {
  const navigate = useNavigate();
  const [type, setType] = useState<AccountType>('receivables');
  const [showPayableForm, setShowPayableForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [payableIdempotencyKey, setPayableIdempotencyKey] = useState(() => crypto.randomUUID());
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState(() => crypto.randomUUID());
  const accountsQuery = useAccounts(type);
  const createPayableMutation = useCreatePayable();
  const recordPaymentMutation = useRecordPayment(type);

  const accounts = accountsQuery.data ?? [];
  const outstandingTotal = accounts.reduce((sum, account) => sum + Number(account.balance), 0);

  const handleCreatePayable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');
    const formData = new FormData(event.currentTarget);
    const amountPaid = Number(formData.get('amountPaid') ?? 0);
    try {
      await createPayableMutation.mutateAsync({
        idempotencyKey: payableIdempotencyKey,
        payable: {
          payeeName: String(formData.get('payeeName') ?? '').trim(),
          payeeType: String(formData.get('payeeType')) as 'supplier' | 'other',
          description: String(formData.get('description') ?? '').trim(),
          amount: Number(formData.get('amount')),
          amountPaid,
          paymentMethod: amountPaid > 0
            ? String(formData.get('initialPaymentMethod')) as PaymentMethod
            : undefined,
        },
      });
      setShowPayableForm(false);
      setPayableIdempotencyKey(crypto.randomUUID());
      setNotice('Payable recorded.');
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not save this payable'));
    }
  };

  const handleRecordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAccount) return;
    setErrorMessage('');
    setNotice('');
    try {
      await recordPaymentMutation.mutateAsync({
        id: selectedAccount.id,
        amount: Number(paymentAmount),
        paymentMethod,
        idempotencyKey: paymentIdempotencyKey,
      });
      setSelectedAccount(null);
      setPaymentIdempotencyKey(crypto.randomUUID());
      setNotice('Payment recorded.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not record this payment'));
    }
  };

  const handleDownload = async () => {
    setErrorMessage('');
    try {
      await downloadAccountsCsv(type);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not export this account list'));
    }
  };

  const openPaymentForm = (account: AccountRecord) => {
    setErrorMessage('');
    setPaymentAmount(account.balance);
    setPaymentMethod('cash');
    setPaymentIdempotencyKey(crypto.randomUUID());
    setSelectedAccount(account);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-sm font-bold text-red-700">Frima Auto</p>
            <h1 className="text-xl font-bold text-slate-900">Customers & Accounts</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download size={17} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </header>

      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Money owed</h2>
            <p className="mt-1 text-slate-500">
              Track customer credit and amounts owed to suppliers or other payees.
            </p>
          </div>
          {type === 'payables' && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                if (!showPayableForm) setPayableIdempotencyKey(crypto.randomUUID());
                setShowPayableForm((open) => !open);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 font-semibold text-white hover:bg-red-800"
            >
              {showPayableForm ? <X size={18} /> : <Plus size={18} />}
              {showPayableForm ? 'Close form' : 'Add payable'}
            </button>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            aria-selected={type === 'receivables'}
            onClick={() => {
              setType('receivables');
              setSelectedAccount(null);
              setShowPayableForm(false);
              setErrorMessage('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === 'receivables' ? 'bg-red-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Customers owing
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={type === 'payables'}
            onClick={() => {
              setType('payables');
              setSelectedAccount(null);
              setErrorMessage('');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === 'payables' ? 'bg-red-700 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Suppliers & other payees
          </button>
        </div>

        {errorMessage && !selectedAccount && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {notice}
          </div>
        )}

        {showPayableForm && type === 'payables' && (
          <form onSubmit={(event) => void handleCreatePayable(event)} className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Record a supplier bill or other amount owed</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Payee name
                <input name="payeeName" required maxLength={200} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Payee type
                <select name="payeeType" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="supplier">Parts supplier</option>
                  <option value="other">Other payee</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Amount owed (KES)
                <input name="amount" type="number" min="0.01" step="0.01" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Description / invoice
                <input name="description" required maxLength={500} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Parts invoice #104" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Amount paid now (KES)
                <input name="amountPaid" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Payment method (if paid now)
                <select name="initialPaymentMethod" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile money</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={createPayableMutation.isPending}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {createPayableMutation.isPending ? 'Saving…' : 'Save payable'}
            </button>
          </form>
        )}

        <section className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {type === 'receivables' ? 'Total customer debt' : 'Total business payables'}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatKes(outstandingTotal)}</p>
          </div>
          <span className="rounded-xl bg-red-50 p-3 text-red-700"><Wallet size={23} /></span>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold text-slate-900">
              {type === 'receivables' ? 'Customers with an outstanding balance' : 'Open amounts to pay'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Settled customer sales are omitted here; all sales remain in the dashboard analytics.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">{type === 'receivables' ? 'Customer' : 'Payee'}</th>
                  {type === 'payables' && <th scope="col" className="px-5 py-3 font-semibold">Type</th>}
                  <th scope="col" className="px-5 py-3 font-semibold">Description</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Paid</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Balance</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {accountsQuery.isLoading ? (
                  <tr><td colSpan={type === 'payables' ? 8 : 7} className="px-5 py-12 text-center text-slate-500">Loading accounts…</td></tr>
                ) : accountsQuery.isError ? (
                  <tr><td colSpan={type === 'payables' ? 8 : 7} className="px-5 py-12 text-center text-red-700">{getErrorMessage(accountsQuery.error, 'Could not load accounts')}</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={type === 'payables' ? 8 : 7} className="px-5 py-12 text-center text-slate-500">
                    {type === 'receivables' ? 'No customers currently owe money.' : 'No open payables. Add a supplier bill or other amount you owe.'}
                  </td></tr>
                ) : accounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100 text-slate-700">
                    <td className="px-5 py-3 font-semibold text-slate-900">{account.counterpartyName}</td>
                    {type === 'payables' && <td className="px-5 py-3 capitalize">{account.counterpartyType}</td>}
                    <td className="px-5 py-3">{account.description}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{formatDate(account.createdAt)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">{formatKes(account.amount)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">{formatKes(account.paid)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-red-700 whitespace-nowrap">{formatKes(account.balance)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openPaymentForm(account)}
                        className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50"
                      >
                        {type === 'receivables' ? 'Record payment' : 'Pay'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedAccount && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={(event) => void handleRecordPayment(event)} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record payment</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedAccount.counterpartyName} · Balance {formatKes(selectedAccount.balance)}</p>
              </div>
              <button type="button" onClick={() => setSelectedAccount(null)} aria-label="Close payment form" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            {errorMessage && (
              <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
            )}
            <label className="mb-4 block text-sm font-medium text-slate-700">
              Payment amount (KES)
              <input
                type="number"
                min="0.01"
                max={selectedAccount.balance}
                step="0.01"
                required
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="mb-5 block text-sm font-medium text-slate-700">
              Payment method
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile money</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={recordPaymentMutation.isPending}
              className="w-full rounded-lg bg-red-700 px-4 py-2.5 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {recordPaymentMutation.isPending ? 'Saving…' : 'Save payment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
