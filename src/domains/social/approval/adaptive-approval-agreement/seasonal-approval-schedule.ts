import * as text from "../../../../kit/text.js";

/** Where a seasonal approval schedule is in its life cycle. */
export type SeasonalApprovalScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal approval schedule. Its code is unique within a tenant. */
export class SeasonalApprovalSchedule {
  code: string;
  label: string;
  locale: string;
  ownerId: string;
  bid: number;
  reviewer: string;
  conversionRate: number;
  floorValue: number;
  status: SeasonalApprovalScheduleStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    ownerId: string,
    bid: number,
    reviewer: string,
    conversionRate: number,
    floorValue: number,
    status: SeasonalApprovalScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.ownerId = ownerId;
    this.bid = bid;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.floorValue = floorValue;
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

  canMoveTo(next: SeasonalApprovalScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalApprovalScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.floorValue * this.conversionRate * 100) / 100;
  }

  copy(): SeasonalApprovalSchedule {
    return new SeasonalApprovalSchedule(
      this.code,
      this.label,
      this.locale,
      this.ownerId,
      this.bid,
      this.reviewer,
      this.conversionRate,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal approval schedule in status proposed. */
export function newSeasonalApprovalSchedule(code: string, label: string): SeasonalApprovalSchedule {
  return new SeasonalApprovalSchedule(code, label, "", "", 0, "", 0, 0, "proposed");
}
