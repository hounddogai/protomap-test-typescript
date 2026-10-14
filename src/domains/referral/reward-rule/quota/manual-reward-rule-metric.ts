import * as text from "../../../../kit/text.js";

/** Where a manual reward rule metric is in its life cycle. */
export type ManualRewardRuleMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One manual reward rule metric, with what the planners need to act on it. */
export class ManualRewardRuleMetric {
  code: string;
  label: string;
  timezone: string;
  ceiling: number;
  category: string;
  budget: number;
  status: ManualRewardRuleMetricStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ceiling: number,
    category: string,
    budget: number,
    status: ManualRewardRuleMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.category = category;
    this.budget = budget;
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

  canMoveTo(next: ManualRewardRuleMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRewardRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual reward rule metric"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.ceiling * this.budget * 100) / 100;
  }

  copy(): ManualRewardRuleMetric {
    return new ManualRewardRuleMetric(
      this.code,
      this.label,
      this.timezone,
      this.ceiling,
      this.category,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual reward rule metric in status planned. */
export function newManualRewardRuleMetric(code: string, label: string): ManualRewardRuleMetric {
  return new ManualRewardRuleMetric(code, label, "", 0, "", 0, "planned");
}
