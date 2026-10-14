import * as text from "../../../../kit/text.js";

/** Where a default streak rule is in its life cycle. */
export type DefaultStreakRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default streak rule as the streak team keeps it. */
export class DefaultStreakRule {
  code: string;
  label: string;
  frequencyCap: number;
  campaignRef: string;
  ceiling: number;
  timezone: string;
  channel: string;
  floorValue: number;
  status: DefaultStreakRuleStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    campaignRef: string,
    ceiling: number,
    timezone: string,
    channel: string,
    floorValue: number,
    status: DefaultStreakRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.timezone = timezone;
    this.channel = channel;
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

  canMoveTo(next: DefaultStreakRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultStreakRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default streak rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round(this.floorValue * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultStreakRule {
    return new DefaultStreakRule(
      this.code,
      this.label,
      this.frequencyCap,
      this.campaignRef,
      this.ceiling,
      this.timezone,
      this.channel,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default streak rule in status proposed. */
export function newDefaultStreakRule(code: string, label: string): DefaultStreakRule {
  return new DefaultStreakRule(code, label, 0, "", 0, "", "", 0, "proposed");
}
