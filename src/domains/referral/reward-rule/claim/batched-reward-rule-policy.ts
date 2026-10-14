import * as text from "../../../../kit/text.js";

/** Where a batched reward rule policy is in its life cycle. */
export type BatchedRewardRulePolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One batched reward rule policy, with what the planners need to act on it. */
export class BatchedRewardRulePolicy {
  code: string;
  title: string;
  checksum: string;
  attributes: Map<string, string>;
  visible: boolean;
  maximum: number;
  attempts: number;
  category: string;
  cohort: string;
  floorValue: number;
  threshold: number;
  status: BatchedRewardRulePolicyStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    attributes: Map<string, string>,
    visible: boolean,
    maximum: number,
    attempts: number,
    category: string,
    cohort: string,
    floorValue: number,
    threshold: number,
    status: BatchedRewardRulePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.attributes = attributes;
    this.visible = visible;
    this.maximum = maximum;
    this.attempts = attempts;
    this.category = category;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedRewardRulePolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedRewardRulePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward rule policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round(this.attempts * this.threshold * 100) / 100;
  }

  copy(): BatchedRewardRulePolicy {
    return new BatchedRewardRulePolicy(
      this.code,
      this.title,
      this.checksum,
      this.attributes,
      this.visible,
      this.maximum,
      this.attempts,
      this.category,
      this.cohort,
      this.floorValue,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched reward rule policy in status idle. */
export function newBatchedRewardRulePolicy(code: string, title: string): BatchedRewardRulePolicy {
  return new BatchedRewardRulePolicy(code, title, "", new Map<string, string>(), false, 0, 0, "", "", 0, 0, "idle");
}
