import * as text from "../../../../kit/text.js";

/** Where a weighted credit schedule is in its life cycle. */
export type WeightedCreditScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted credit schedule. Its code is unique within a tenant. */
export class WeightedCreditSchedule {
  code: string;
  name: string;
  maximum: number;
  minimum: number;
  campaignRef: string;
  openRate: number;
  bid: number;
  status: WeightedCreditScheduleStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    minimum: number,
    campaignRef: string,
    openRate: number,
    bid: number,
    status: WeightedCreditScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.openRate = openRate;
    this.bid = bid;
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

  canMoveTo(next: WeightedCreditScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedCreditScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted credit schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted credit schedule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.maximum * this.minimum * 100) / 100;
  }

  copy(): WeightedCreditSchedule {
    return new WeightedCreditSchedule(
      this.code,
      this.name,
      this.maximum,
      this.minimum,
      this.campaignRef,
      this.openRate,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted credit schedule in status open. */
export function newWeightedCreditSchedule(code: string, name: string): WeightedCreditSchedule {
  return new WeightedCreditSchedule(code, name, 0, 0, "", 0, 0, "open");
}
