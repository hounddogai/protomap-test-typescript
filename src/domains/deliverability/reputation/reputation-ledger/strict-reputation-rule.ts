import * as text from "../../../../kit/text.js";

/** Where a strict reputation rule is in its life cycle. */
export type StrictReputationRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a strict reputation rule and its current status. */
export class StrictReputationRule {
  code: string;
  label: string;
  priority: number;
  maximum: number;
  frequencyCap: number;
  locale: string;
  retries: number;
  journeyId: string;
  reviewer: string;
  status: StrictReputationRuleStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    maximum: number,
    frequencyCap: number,
    locale: string,
    retries: number,
    journeyId: string,
    reviewer: string,
    status: StrictReputationRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.retries = retries;
    this.journeyId = journeyId;
    this.reviewer = reviewer;
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

  canMoveTo(next: StrictReputationRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictReputationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reputation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.priority + this.frequencyCap) * 100) / 100;
  }

  copy(): StrictReputationRule {
    return new StrictReputationRule(
      this.code,
      this.label,
      this.priority,
      this.maximum,
      this.frequencyCap,
      this.locale,
      this.retries,
      this.journeyId,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict reputation rule in status open. */
export function newStrictReputationRule(code: string, label: string): StrictReputationRule {
  return new StrictReputationRule(code, label, 0, 0, 0, "", 0, "", "", "open");
}
