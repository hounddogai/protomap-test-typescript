import * as text from "../../../../kit/text.js";

/** Where a fallback challenge ledger is in its life cycle. */
export type FallbackChallengeLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback challenge ledger. Its code is unique within a tenant. */
export class FallbackChallengeLedger {
  code: string;
  name: string;
  country: string;
  endsAt: number;
  conversionRate: number;
  pinned: boolean;
  category: string;
  contactEmail: string;
  channel: string;
  status: FallbackChallengeLedgerStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    endsAt: number,
    conversionRate: number,
    pinned: boolean,
    category: string,
    contactEmail: string,
    channel: string,
    status: FallbackChallengeLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.category = category;
    this.contactEmail = contactEmail;
    this.channel = channel;
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

  canMoveTo(next: FallbackChallengeLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackChallengeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback challenge ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.endsAt + this.conversionRate) * 100) / 100;
  }

  copy(): FallbackChallengeLedger {
    return new FallbackChallengeLedger(
      this.code,
      this.name,
      this.country,
      this.endsAt,
      this.conversionRate,
      this.pinned,
      this.category,
      this.contactEmail,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback challenge ledger in status proposed. */
export function newFallbackChallengeLedger(code: string, name: string): FallbackChallengeLedger {
  return new FallbackChallengeLedger(code, name, "", 0, 0, false, "", "", "", "proposed");
}
