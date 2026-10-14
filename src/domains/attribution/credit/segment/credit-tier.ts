import * as text from "../../../../kit/text.js";

/** Where a credit tier is in its life cycle. */
export type CreditTierStatus = "created" | "validated" | "published" | "retired";

/** One credit tier, with what the planners need to act on it. */
export class CreditTier {
  code: string;
  label: string;
  locale: string;
  source: string;
  phone: string;
  endsAt: number;
  segment: string;
  maximum: number;
  retries: number;
  status: CreditTierStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    source: string,
    phone: string,
    endsAt: number,
    segment: string,
    maximum: number,
    retries: number,
    status: CreditTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.source = source;
    this.phone = phone;
    this.endsAt = endsAt;
    this.segment = segment;
    this.maximum = maximum;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.endsAt - this.retries) * 100) / 100;
  }

  copy(): CreditTier {
    return new CreditTier(
      this.code,
      this.label,
      this.locale,
      this.source,
      this.phone,
      this.endsAt,
      this.segment,
      this.maximum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit tier in status created. */
export function newCreditTier(code: string, label: string): CreditTier {
  return new CreditTier(code, label, "", "", "", 0, "", 0, 0, "created");
}
