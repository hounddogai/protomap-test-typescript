import * as text from "../../../../kit/text.js";

/** Where a fallback reward rule bundle is in its life cycle. */
export type FallbackRewardRuleBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback reward rule bundle and its current status. */
export class FallbackRewardRuleBundle {
  code: string;
  title: string;
  currency: string;
  margin: number;
  priority: number;
  minimum: number;
  category: string;
  status: FallbackRewardRuleBundleStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    margin: number,
    priority: number,
    minimum: number,
    category: string,
    status: FallbackRewardRuleBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.margin = margin;
    this.priority = priority;
    this.minimum = minimum;
    this.category = category;
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

  canMoveTo(next: FallbackRewardRuleBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackRewardRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin - this.minimum) * 100) / 100;
  }

  copy(): FallbackRewardRuleBundle {
    return new FallbackRewardRuleBundle(
      this.code,
      this.title,
      this.currency,
      this.margin,
      this.priority,
      this.minimum,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback reward rule bundle in status idle. */
export function newFallbackRewardRuleBundle(code: string, title: string): FallbackRewardRuleBundle {
  return new FallbackRewardRuleBundle(code, title, "", 0, 0, 0, "", "idle");
}
