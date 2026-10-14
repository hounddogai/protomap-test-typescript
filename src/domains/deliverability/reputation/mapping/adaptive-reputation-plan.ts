import * as text from "../../../../kit/text.js";

/** Where a adaptive reputation plan is in its life cycle. */
export type AdaptiveReputationPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive reputation plan and its current status. */
export class AdaptiveReputationPlan {
  code: string;
  name: string;
  startsAt: number;
  channel: string;
  timezone: string;
  frequencyCap: number;
  country: string;
  label: string;
  status: AdaptiveReputationPlanStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    channel: string,
    timezone: string,
    frequencyCap: number,
    country: string,
    label: string,
    status: AdaptiveReputationPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.channel = channel;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.country = country;
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

  canMoveTo(next: AdaptiveReputationPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveReputationPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reputation plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.frequencyCap + this.startsAt) * 100) / 100;
  }

  copy(): AdaptiveReputationPlan {
    return new AdaptiveReputationPlan(
      this.code,
      this.name,
      this.startsAt,
      this.channel,
      this.timezone,
      this.frequencyCap,
      this.country,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive reputation plan in status proposed. */
export function newAdaptiveReputationPlan(code: string, name: string): AdaptiveReputationPlan {
  return new AdaptiveReputationPlan(code, name, 0, "", "", 0, "", "", "proposed");
}
