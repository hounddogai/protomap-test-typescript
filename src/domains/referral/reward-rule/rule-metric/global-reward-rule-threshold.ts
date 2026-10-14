import * as text from "../../../../kit/text.js";

/** Where a global reward rule threshold is in its life cycle. */
export type GlobalRewardRuleThresholdStatus = "created" | "validated" | "published" | "retired";

/** One global reward rule threshold, with what the planners need to act on it. */
export class GlobalRewardRuleThreshold {
  code: string;
  title: string;
  quantity: number;
  category: string;
  audienceId: string;
  endsAt: number;
  impressions: number;
  openRate: number;
  budget: number;
  status: GlobalRewardRuleThresholdStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    category: string,
    audienceId: string,
    endsAt: number,
    impressions: number,
    openRate: number,
    budget: number,
    status: GlobalRewardRuleThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.category = category;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.openRate = openRate;
    this.budget = budget;
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

  canMoveTo(next: GlobalRewardRuleThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global reward rule threshold"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.openRate) * 100) / 100;
  }

  copy(): GlobalRewardRuleThreshold {
    return new GlobalRewardRuleThreshold(
      this.code,
      this.title,
      this.quantity,
      this.category,
      this.audienceId,
      this.endsAt,
      this.impressions,
      this.openRate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global reward rule threshold in status created. */
export function newGlobalRewardRuleThreshold(code: string, title: string): GlobalRewardRuleThreshold {
  return new GlobalRewardRuleThreshold(code, title, 0, "", "", 0, 0, 0, 0, "created");
}
