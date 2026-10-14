import * as text from "../../../../kit/text.js";

/** Where a sla variance is in its life cycle. */
export type SlaVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One sla variance, with what the planners need to act on it. */
export class SlaVariance {
  code: string;
  title: string;
  contactEmail: string;
  createdAt: number;
  quantity: number;
  conversionRate: number;
  cost: number;
  bid: number;
  durationMinutes: number;
  status: SlaVarianceStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    createdAt: number,
    quantity: number,
    conversionRate: number,
    cost: number,
    bid: number,
    durationMinutes: number,
    status: SlaVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"sla variance"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.durationMinutes + this.cost) * 100) / 100;
  }

  copy(): SlaVariance {
    return new SlaVariance(
      this.code,
      this.title,
      this.contactEmail,
      this.createdAt,
      this.quantity,
      this.conversionRate,
      this.cost,
      this.bid,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla variance in status open. */
export function newSlaVariance(code: string, title: string): SlaVariance {
  return new SlaVariance(code, title, "", 0, 0, 0, 0, 0, 0, "open");
}
