import * as text from "../../../../kit/text.js";

/** Where a global retention assignment is in its life cycle. */
export type GlobalRetentionAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global retention assignment and its current status. */
export class GlobalRetentionAssignment {
  code: string;
  title: string;
  cost: number;
  category: string;
  discount: number;
  bid: number;
  pinned: boolean;
  region: string;
  country: string;
  minimum: number;
  conversionRate: number;
  status: GlobalRetentionAssignmentStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    category: string,
    discount: number,
    bid: number,
    pinned: boolean,
    region: string,
    country: string,
    minimum: number,
    conversionRate: number,
    status: GlobalRetentionAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.category = category;
    this.discount = discount;
    this.bid = bid;
    this.pinned = pinned;
    this.region = region;
    this.country = country;
    this.minimum = minimum;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalRetentionAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRetentionAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round(this.minimum * this.discount * 100) / 100;
  }

  copy(): GlobalRetentionAssignment {
    return new GlobalRetentionAssignment(
      this.code,
      this.title,
      this.cost,
      this.category,
      this.discount,
      this.bid,
      this.pinned,
      this.region,
      this.country,
      this.minimum,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global retention assignment in status draft. */
export function newGlobalRetentionAssignment(code: string, title: string): GlobalRetentionAssignment {
  return new GlobalRetentionAssignment(code, title, 0, "", 0, 0, false, "", "", 0, 0, "draft");
}
