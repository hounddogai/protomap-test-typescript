import * as text from "../../../../kit/text.js";

/** Where a reward rule tier is in its life cycle. */
export type RewardRuleTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule tier as the reward rule team keeps it. */
export class RewardRuleTier {
  code: string;
  label: string;
  updatedAt: number;
  source: string;
  maximum: number;
  summary: string;
  attempts: number;
  locale: string;
  weight: number;
  openRate: number;
  limit: number;
  status: RewardRuleTierStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    source: string,
    maximum: number,
    summary: string,
    attempts: number,
    locale: string,
    weight: number,
    openRate: number,
    limit: number,
    status: RewardRuleTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.source = source;
    this.maximum = maximum;
    this.summary = summary;
    this.attempts = attempts;
    this.locale = locale;
    this.weight = weight;
    this.openRate = openRate;
    this.limit = limit;
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

  canMoveTo(next: RewardRuleTierStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: RewardRuleTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.updatedAt + this.maximum) * 100) / 100;
  }

  copy(): RewardRuleTier {
    return new RewardRuleTier(
      this.code,
      this.label,
      this.updatedAt,
      this.source,
      this.maximum,
      this.summary,
      this.attempts,
      this.locale,
      this.weight,
      this.openRate,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward rule tier in status planned. */
export function newRewardRuleTier(code: string, label: string): RewardRuleTier {
  return new RewardRuleTier(code, label, 0, "", 0, "", 0, "", 0, 0, 0, "planned");
}
