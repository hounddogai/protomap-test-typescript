import * as text from "../../../../kit/text.js";

/** Where a seasonal step cycle is in its life cycle. */
export type SeasonalStepCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal step cycle and its current status. */
export class SeasonalStepCycle {
  code: string;
  label: string;
  impressions: number;
  maximum: number;
  revision: number;
  visible: boolean;
  windowDays: number;
  campaignRef: string;
  amount: number;
  checksum: string;
  status: SeasonalStepCycleStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    maximum: number,
    revision: number,
    visible: boolean,
    windowDays: number,
    campaignRef: string,
    amount: number,
    checksum: string,
    status: SeasonalStepCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.maximum = maximum;
    this.revision = revision;
    this.visible = visible;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.checksum = checksum;
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

  canMoveTo(next: SeasonalStepCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalStepCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal step cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.maximum - this.impressions) * 100) / 100;
  }

  copy(): SeasonalStepCycle {
    return new SeasonalStepCycle(
      this.code,
      this.label,
      this.impressions,
      this.maximum,
      this.revision,
      this.visible,
      this.windowDays,
      this.campaignRef,
      this.amount,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal step cycle in status planned. */
export function newSeasonalStepCycle(code: string, label: string): SeasonalStepCycle {
  return new SeasonalStepCycle(code, label, 0, 0, 0, false, 0, "", 0, "", "planned");
}
