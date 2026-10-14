import * as text from "../../../../kit/text.js";

/** Where a seasonal reward rule milestone is in its life cycle. */
export type SeasonalRewardRuleMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a seasonal reward rule milestone and its current status. */
export class SeasonalRewardRuleMilestone {
  code: string;
  label: string;
  externalRef: string;
  variant: string;
  margin: number;
  name: string;
  segment: string;
  updatedAt: number;
  status: SeasonalRewardRuleMilestoneStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    variant: string,
    margin: number,
    name: string,
    segment: string,
    updatedAt: number,
    status: SeasonalRewardRuleMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.variant = variant;
    this.margin = margin;
    this.name = name;
    this.segment = segment;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: SeasonalRewardRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalRewardRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal reward rule milestone"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin - this.updatedAt) * 100) / 100;
  }

  copy(): SeasonalRewardRuleMilestone {
    return new SeasonalRewardRuleMilestone(
      this.code,
      this.label,
      this.externalRef,
      this.variant,
      this.margin,
      this.name,
      this.segment,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal reward rule milestone in status proposed. */
export function newSeasonalRewardRuleMilestone(code: string, label: string): SeasonalRewardRuleMilestone {
  return new SeasonalRewardRuleMilestone(code, label, "", "", 0, "", "", 0, "proposed");
}
