import * as text from "../../../../kit/text.js";

/** Where a credit ledger is in its life cycle. */
export type CreditLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a credit ledger and its current status. */
export class CreditLedger {
  code: string;
  name: string;
  description: string;
  locale: string;
  country: string;
  sequence: number;
  externalRef: string;
  utmSource: string;
  tags: string[];
  quantity: number;
  status: CreditLedgerStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    locale: string,
    country: string,
    sequence: number,
    externalRef: string,
    utmSource: string,
    tags: string[],
    quantity: number,
    status: CreditLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.locale = locale;
    this.country = country;
    this.sequence = sequence;
    this.externalRef = externalRef;
    this.utmSource = utmSource;
    this.tags = tags;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreditLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.sequence - this.quantity) * 100) / 100;
  }

  copy(): CreditLedger {
    return new CreditLedger(
      this.code,
      this.name,
      this.description,
      this.locale,
      this.country,
      this.sequence,
      this.externalRef,
      this.utmSource,
      this.tags,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit ledger in status proposed. */
export function newCreditLedger(code: string, name: string): CreditLedger {
  return new CreditLedger(code, name, "", "", "", 0, "", "", [], 0, "proposed");
}
