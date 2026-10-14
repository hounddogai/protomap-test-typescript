/**
 * Amounts of money in minor units, with their currency.
 */

/** An amount of money. Arithmetic refuses to mix currencies. */
export class Amount {
  /** Minor units, such as cents. */
  units: number;
  /** ISO 4217 code. */
  currency: string;

  constructor(units: number, currency: string) {
    this.units = units;
    this.currency = currency;
  }

  plus(other: Amount): Amount {
    if (this.currency !== other.currency) {
      throw new Error(`cannot add ${other.currency} to ${this.currency}`);
    }
    return new Amount(this.units + other.units, this.currency);
  }

  minus(other: Amount): Amount {
    if (this.currency !== other.currency) {
      throw new Error(`cannot subtract ${other.currency} from ${this.currency}`);
    }
    return new Amount(this.units - other.units, this.currency);
  }

  scaled(factor: number): Amount {
    const units = Math.trunc(Math.floor(this.units * factor + 0.5));
    return new Amount(units, this.currency);
  }

  isZero(): boolean {
    return this.units === 0;
  }

  format(): string {
    const major = Math.trunc(this.units / 100);
    const minor = Math.abs(this.units % 100);
    return `${this.currency} ${major}.${String(minor).padStart(2, "0")}`;
  }

  split(count: number): Amount[] {
    const shares: Amount[] = [];
    if (count <= 0) return shares;
    const base = Math.trunc(this.units / count);
    const rest = this.units % count;
    for (let i = 0; i < count; i++) {
      let units = base;
      if (i < rest) {
        units += 1;
      }
      shares.push(new Amount(units, this.currency));
    }
    return shares;
  }
}

export function of(units: number, currency: string): Amount {
  return new Amount(units, currency.trim().toUpperCase());
}

export function total(amounts: Amount[], currency: string): Amount {
  let sum = of(0, currency);
  for (const item of amounts) {
    const next = sum.plus(item);
    sum = next;
  }
  return sum;
}
