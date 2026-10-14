import * as text from "../../../../kit/text.js";

/** Where a primary bid rule schedule is in its life cycle. */
export type PrimaryBidRuleScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary bid rule schedule and its current status. */
export class PrimaryBidRuleSchedule {
  code: string;
  name: string;
  openRate: number;
  impressions: number;
  currency: string;
  channel: string;
  cost: number;
  country: string;
  ownerId: string;
  variant: string;
  label: string;
  status: PrimaryBidRuleScheduleStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    impressions: number,
    currency: string,
    channel: string,
    cost: number,
    country: string,
    ownerId: string,
    variant: string,
    label: string,
    status: PrimaryBidRuleScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.impressions = impressions;
    this.currency = currency;
    this.channel = channel;
    this.cost = cost;
    this.country = country;
    this.ownerId = ownerId;
    this.variant = variant;
    this.label = label;
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

  canMoveTo(next: PrimaryBidRuleScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryBidRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary bid rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary bid rule schedule"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.impressions * this.openRate * 100) / 100;
  }

  copy(): PrimaryBidRuleSchedule {
    return new PrimaryBidRuleSchedule(
      this.code,
      this.name,
      this.openRate,
      this.impressions,
      this.currency,
      this.channel,
      this.cost,
      this.country,
      this.ownerId,
      this.variant,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary bid rule schedule in status proposed. */
export function newPrimaryBidRuleSchedule(code: string, name: string): PrimaryBidRuleSchedule {
  return new PrimaryBidRuleSchedule(code, name, 0, 0, "", "", 0, "", "", "", "", "proposed");
}
