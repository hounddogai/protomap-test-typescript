import * as text from "../../../../kit/text.js";

/** Where a primary insight plan is in its life cycle. */
export type PrimaryInsightPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary insight plan as the insight team keeps it. */
export class PrimaryInsightPlan {
  code: string;
  title: string;
  country: string;
  channel: string;
  discount: number;
  windowDays: number;
  version: number;
  status: PrimaryInsightPlanStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    channel: string,
    discount: number,
    windowDays: number,
    version: number,
    status: PrimaryInsightPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.channel = channel;
    this.discount = discount;
    this.windowDays = windowDays;
    this.version = version;
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

  canMoveTo(next: PrimaryInsightPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"primary insight plan"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.windowDays - this.version) * 100) / 100;
  }

  copy(): PrimaryInsightPlan {
    return new PrimaryInsightPlan(
      this.code,
      this.title,
      this.country,
      this.channel,
      this.discount,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary insight plan in status proposed. */
export function newPrimaryInsightPlan(code: string, title: string): PrimaryInsightPlan {
  return new PrimaryInsightPlan(code, title, "", "", 0, 0, 0, "proposed");
}
