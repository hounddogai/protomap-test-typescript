import * as text from "../../../../kit/text.js";

/** Where a preference milestone is in its life cycle. */
export type PreferenceMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One preference milestone, with what the planners need to act on it. */
export class PreferenceMilestone {
  code: string;
  name: string;
  externalRef: string;
  impressions: number;
  retries: number;
  budget: number;
  label: string;
  ratio: number;
  openRate: number;
  maximum: number;
  status: PreferenceMilestoneStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    impressions: number,
    retries: number,
    budget: number,
    label: string,
    ratio: number,
    openRate: number,
    maximum: number,
    status: PreferenceMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.retries = retries;
    this.budget = budget;
    this.label = label;
    this.ratio = ratio;
    this.openRate = openRate;
    this.maximum = maximum;
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

  canMoveTo(next: PreferenceMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"preference milestone"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.openRate - this.retries) * 100) / 100;
  }

  copy(): PreferenceMilestone {
    return new PreferenceMilestone(
      this.code,
      this.name,
      this.externalRef,
      this.impressions,
      this.retries,
      this.budget,
      this.label,
      this.ratio,
      this.openRate,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference milestone in status open. */
export function newPreferenceMilestone(code: string, name: string): PreferenceMilestone {
  return new PreferenceMilestone(code, name, "", 0, 0, 0, "", 0, 0, 0, "open");
}
