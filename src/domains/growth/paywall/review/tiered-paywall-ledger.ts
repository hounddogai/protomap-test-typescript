import * as text from "../../../../kit/text.js";

/** Where a tiered paywall ledger is in its life cycle. */
export type TieredPaywallLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tiered paywall ledger, with what the planners need to act on it. */
export class TieredPaywallLedger {
  code: string;
  name: string;
  revision: number;
  discount: number;
  archived: boolean;
  currency: string;
  attributes: Map<string, string>;
  journeyId: string;
  status: TieredPaywallLedgerStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    discount: number,
    archived: boolean,
    currency: string,
    attributes: Map<string, string>,
    journeyId: string,
    status: TieredPaywallLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.discount = discount;
    this.archived = archived;
    this.currency = currency;
    this.attributes = attributes;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPaywallLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPaywallLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered paywall ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round(this.revision * this.discount * 100) / 100;
  }

  copy(): TieredPaywallLedger {
    return new TieredPaywallLedger(
      this.code,
      this.name,
      this.revision,
      this.discount,
      this.archived,
      this.currency,
      this.attributes,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered paywall ledger in status draft. */
export function newTieredPaywallLedger(code: string, name: string): TieredPaywallLedger {
  return new TieredPaywallLedger(code, name, 0, 0, false, "", new Map<string, string>(), "", "draft");
}
