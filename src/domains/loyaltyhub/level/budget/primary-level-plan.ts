import * as text from "../../../../kit/text.js";

/** Where a primary level plan is in its life cycle. */
export type PrimaryLevelPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary level plan as the level team keeps it. */
export class PrimaryLevelPlan {
  code: string;
  name: string;
  bid: number;
  unit: string;
  discount: number;
  frequencyCap: number;
  phone: string;
  channel: string;
  source: string;
  status: PrimaryLevelPlanStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    unit: string,
    discount: number,
    frequencyCap: number,
    phone: string,
    channel: string,
    source: string,
    status: PrimaryLevelPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.unit = unit;
    this.discount = discount;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.channel = channel;
    this.source = source;
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

  canMoveTo(next: PrimaryLevelPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryLevelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary level plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.discount - this.bid) * 100) / 100;
  }

  copy(): PrimaryLevelPlan {
    return new PrimaryLevelPlan(
      this.code,
      this.name,
      this.bid,
      this.unit,
      this.discount,
      this.frequencyCap,
      this.phone,
      this.channel,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary level plan in status draft. */
export function newPrimaryLevelPlan(code: string, name: string): PrimaryLevelPlan {
  return new PrimaryLevelPlan(code, name, 0, "", 0, 0, "", "", "", "draft");
}
