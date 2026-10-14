/**
 * The adaptive reward rule target records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule target is in its life cycle. */
export type AdaptiveRewardRuleTargetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive reward rule target, with what the planners need to act on it. */
export class AdaptiveRewardRuleTarget {
  code: string;
  title: string;
  priority: number;
  channel: string;
  label: string;
  unit: string;
  impressions: number;
  status: AdaptiveRewardRuleTargetStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    channel: string,
    label: string,
    unit: string,
    impressions: number,
    status: AdaptiveRewardRuleTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.channel = channel;
    this.label = label;
    this.unit = unit;
    this.impressions = impressions;
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

  canMoveTo(next: AdaptiveRewardRuleTargetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive reward rule target"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.impressions + this.priority) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleTarget {
    return new AdaptiveRewardRuleTarget(
      this.code,
      this.title,
      this.priority,
      this.channel,
      this.label,
      this.unit,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive reward rule target in status open. */
export function newAdaptiveRewardRuleTarget(code: string, title: string): AdaptiveRewardRuleTarget {
  return new AdaptiveRewardRuleTarget(code, title, 0, "", "", "", 0, "open");
}
