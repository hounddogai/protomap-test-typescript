import * as text from "../../../../kit/text.js";

/** Where a adaptive reply budget is in its life cycle. */
export type AdaptiveReplyBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a adaptive reply budget and its current status. */
export class AdaptiveReplyBudget {
  code: string;
  name: string;
  threshold: number;
  margin: number;
  sequence: number;
  conversionRate: number;
  expiresAt: number;
  discount: number;
  tags: string[];
  summary: string;
  status: AdaptiveReplyBudgetStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    margin: number,
    sequence: number,
    conversionRate: number,
    expiresAt: number,
    discount: number,
    tags: string[],
    summary: string,
    status: AdaptiveReplyBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.margin = margin;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.tags = tags;
    this.summary = summary;
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

  canMoveTo(next: AdaptiveReplyBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: AdaptiveReplyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reply budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.discount - this.margin) * 100) / 100;
  }

  copy(): AdaptiveReplyBudget {
    return new AdaptiveReplyBudget(
      this.code,
      this.name,
      this.threshold,
      this.margin,
      this.sequence,
      this.conversionRate,
      this.expiresAt,
      this.discount,
      this.tags,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive reply budget in status planned. */
export function newAdaptiveReplyBudget(code: string, name: string): AdaptiveReplyBudget {
  return new AdaptiveReplyBudget(code, name, 0, 0, 0, 0, 0, 0, [], "", "planned");
}
