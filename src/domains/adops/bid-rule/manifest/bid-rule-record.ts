import * as text from "../../../../kit/text.js";

/** Where a bid rule record is in its life cycle. */
export type BidRuleRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One bid rule record, with what the planners need to act on it. */
export class BidRuleRecord {
  code: string;
  title: string;
  source: string;
  unit: string;
  cost: number;
  floorValue: number;
  weight: number;
  endsAt: number;
  status: BidRuleRecordStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    unit: string,
    cost: number,
    floorValue: number,
    weight: number,
    endsAt: number,
    status: BidRuleRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.unit = unit;
    this.cost = cost;
    this.floorValue = floorValue;
    this.weight = weight;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BidRuleRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule record"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.cost * 100) / 100;
  }

  copy(): BidRuleRecord {
    return new BidRuleRecord(
      this.code,
      this.title,
      this.source,
      this.unit,
      this.cost,
      this.floorValue,
      this.weight,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a bid rule record in status requested. */
export function newBidRuleRecord(code: string, title: string): BidRuleRecord {
  return new BidRuleRecord(code, title, "", "", 0, 0, 0, 0, "requested");
}
