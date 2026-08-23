export type Entry = { account: string; debit: bigint; credit: bigint };
export type Payment = { idempotencyKey: string; from: string; to: string; amount: bigint };

export class Ledger {
  private readonly balances = new Map<string, bigint>();
  private readonly processed = new Set<string>();

  apply(payment: Payment): boolean {
    if (payment.amount <= 0n || payment.from === payment.to) throw new Error('invalid payment');
    if (this.processed.has(payment.idempotencyKey)) return false;
    const sender = this.balances.get(payment.from) ?? 0n;
    if (sender < payment.amount) throw new Error('insufficient funds');
    this.balances.set(payment.from, sender - payment.amount);
    this.balances.set(payment.to, (this.balances.get(payment.to) ?? 0n) + payment.amount);
    this.processed.add(payment.idempotencyKey);
    return true;
  }

  credit(account: string, amount: bigint): void {
    if (amount <= 0n) throw new Error('amount must be positive');
    this.balances.set(account, (this.balances.get(account) ?? 0n) + amount);
  }

  balance(account: string): bigint { return this.balances.get(account) ?? 0n; }
}

const l = new Ledger(); l.credit('alice', 1000n); l.apply({ idempotencyKey: 'p1', from: 'alice', to: 'bob', amount: 250n });
console.log({ alice: l.balance('alice').toString(), bob: l.balance('bob').toString() });
