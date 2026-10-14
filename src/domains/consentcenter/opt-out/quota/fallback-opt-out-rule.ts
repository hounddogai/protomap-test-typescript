import * as text from "../../../../kit/text.js";

/** Where a fallback opt out rule is in its life cycle. */
export type FallbackOptOutRuleStatus = "created" | "validated" | "published" | "retired";

/** One fallback opt out rule, with what the planners need to act on it. */
export class FallbackOptOutRule {
  code: string;
  label: string;
  budget: number;
  weight: number;
  audienceId: string;
  reviewer: string;
  retries: number;
  timezone: string;
  status: FallbackOptOutRuleStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    weight: number,
    audienceId: string,
    reviewer: string,
    retries: number,
    timezone: string,
    status: FallbackOptOutRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.weight = weight;
    this.audienceId = audienceId;
    this.reviewer = reviewer;
    this.retries = retries;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackOptOutRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackOptOutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback opt out rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.budget - this.retries) * 100) / 100;
  }

  copy(): FallbackOptOutRule {
    return new FallbackOptOutRule(
      this.code,
      this.label,
      this.budget,
      this.weight,
      this.audienceId,
      this.reviewer,
      this.retries,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback opt out rule in status created. */
export function newFallbackOptOutRule(code: string, label: string): FallbackOptOutRule {
  return new FallbackOptOutRule(code, label, 0, 0, "", "", 0, "", "created");
}
