import * as text from "../../../../kit/text.js";

/** Where a capped tier record is in its life cycle. */
export type CappedTierRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped tier record and its current status. */
export class CappedTierRecord {
  code: string;
  label: string;
  category: string;
  updatedAt: number;
  name: string;
  region: string;
  clicks: number;
  sendAt: number;
  bid: number;
  discount: number;
  segment: string;
  status: CappedTierRecordStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    updatedAt: number,
    name: string,
    region: string,
    clicks: number,
    sendAt: number,
    bid: number,
    discount: number,
    segment: string,
    status: CappedTierRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.updatedAt = updatedAt;
    this.name = name;
    this.region = region;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.bid = bid;
    this.discount = discount;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedTierRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedTierRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped tier record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.bid + this.clicks) * 100) / 100;
  }

  copy(): CappedTierRecord {
    return new CappedTierRecord(
      this.code,
      this.label,
      this.category,
      this.updatedAt,
      this.name,
      this.region,
      this.clicks,
      this.sendAt,
      this.bid,
      this.discount,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped tier record in status planned. */
export function newCappedTierRecord(code: string, label: string): CappedTierRecord {
  return new CappedTierRecord(code, label, "", 0, "", "", 0, 0, 0, 0, "", "planned");
}
