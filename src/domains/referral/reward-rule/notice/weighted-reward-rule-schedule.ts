import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule schedule is in its life cycle. */
export type WeightedRewardRuleScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted reward rule schedule and its current status. */
export class WeightedRewardRuleSchedule {
  code: string;
  title: string;
  maximum: number;
  cost: number;
  country: string;
  externalRef: string;
  rate: number;
  status: WeightedRewardRuleScheduleStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    cost: number,
    country: string,
    externalRef: string,
    rate: number,
    status: WeightedRewardRuleScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.cost = cost;
    this.country = country;
    this.externalRef = externalRef;
    this.rate = rate;
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

  canMoveTo(next: WeightedRewardRuleScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted reward rule schedule"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.maximum + this.rate) * 100) / 100;
  }

  copy(): WeightedRewardRuleSchedule {
    return new WeightedRewardRuleSchedule(
      this.code,
      this.title,
      this.maximum,
      this.cost,
      this.country,
      this.externalRef,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted reward rule schedule in status proposed. */
export function newWeightedRewardRuleSchedule(code: string, title: string): WeightedRewardRuleSchedule {
  return new WeightedRewardRuleSchedule(code, title, 0, 0, "", "", 0, "proposed");
}
