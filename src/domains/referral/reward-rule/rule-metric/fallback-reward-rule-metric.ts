/**
 * The fallback reward rule metric records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback reward rule metric is in its life cycle. */
export type FallbackRewardRuleMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback reward rule metric, with what the planners need to act on it. */
export class FallbackRewardRuleMetric {
  code: string;
  name: string;
  unit: string;
  threshold: number;
  summary: string;
  segment: string;
  status: FallbackRewardRuleMetricStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    threshold: number,
    summary: string,
    segment: string,
    status: FallbackRewardRuleMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.threshold = threshold;
    this.summary = summary;
    this.segment = segment;
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

  canMoveTo(next: FallbackRewardRuleMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackRewardRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): FallbackRewardRuleMetric {
    return new FallbackRewardRuleMetric(
      this.code,
      this.name,
      this.unit,
      this.threshold,
      this.summary,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback reward rule metric in status open. */
export function newFallbackRewardRuleMetric(code: string, name: string): FallbackRewardRuleMetric {
  return new FallbackRewardRuleMetric(code, name, "", 0, "", "", "open");
}
