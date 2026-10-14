import * as text from "../../../../kit/text.js";

/** Where a lenient reward audit is in its life cycle. */
export type LenientRewardAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient reward audit and its current status. */
export class LenientRewardAudit {
  code: string;
  name: string;
  region: string;
  campaignRef: string;
  capacity: number;
  approved: boolean;
  score: number;
  quantity: number;
  windowDays: number;
  priority: number;
  status: LenientRewardAuditStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    campaignRef: string,
    capacity: number,
    approved: boolean,
    score: number,
    quantity: number,
    windowDays: number,
    priority: number,
    status: LenientRewardAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.approved = approved;
    this.score = score;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.priority = priority;
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

  canMoveTo(next: LenientRewardAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRewardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays - this.priority) * 100) / 100;
  }

  copy(): LenientRewardAudit {
    return new LenientRewardAudit(
      this.code,
      this.name,
      this.region,
      this.campaignRef,
      this.capacity,
      this.approved,
      this.score,
      this.quantity,
      this.windowDays,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient reward audit in status planned. */
export function newLenientRewardAudit(code: string, name: string): LenientRewardAudit {
  return new LenientRewardAudit(code, name, "", "", 0, false, 0, 0, 0, 0, "planned");
}
