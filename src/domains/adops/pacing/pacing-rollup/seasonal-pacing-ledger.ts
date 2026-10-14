import * as text from "../../../../kit/text.js";

/** Where a seasonal pacing ledger is in its life cycle. */
export type SeasonalPacingLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal pacing ledger as the pacing team keeps it. */
export class SeasonalPacingLedger {
  code: string;
  name: string;
  amount: number;
  campaignRef: string;
  description: string;
  version: number;
  attributes: Map<string, string>;
  bid: number;
  status: SeasonalPacingLedgerStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    campaignRef: string,
    description: string,
    version: number,
    attributes: Map<string, string>,
    bid: number,
    status: SeasonalPacingLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.description = description;
    this.version = version;
    this.attributes = attributes;
    this.bid = bid;
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

  canMoveTo(next: SeasonalPacingLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalPacingLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal pacing ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.amount - this.bid) * 100) / 100;
  }

  copy(): SeasonalPacingLedger {
    return new SeasonalPacingLedger(
      this.code,
      this.name,
      this.amount,
      this.campaignRef,
      this.description,
      this.version,
      this.attributes,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal pacing ledger in status draft. */
export function newSeasonalPacingLedger(code: string, name: string): SeasonalPacingLedger {
  return new SeasonalPacingLedger(code, name, 0, "", "", 0, new Map<string, string>(), 0, "draft");
}
