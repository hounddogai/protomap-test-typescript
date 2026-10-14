import * as text from "../../../../kit/text.js";

/** Where a reward rule batch is in its life cycle. */
export type RewardRuleBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reward rule batch, with what the planners need to act on it. */
export class RewardRuleBatch {
  code: string;
  name: string;
  utmSource: string;
  frequencyCap: number;
  score: number;
  budget: number;
  ceiling: number;
  status: RewardRuleBatchStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    frequencyCap: number,
    score: number,
    budget: number,
    ceiling: number,
    status: RewardRuleBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.budget = budget;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.budget - this.score) * 100) / 100;
  }

  copy(): RewardRuleBatch {
    return new RewardRuleBatch(
      this.code,
      this.name,
      this.utmSource,
      this.frequencyCap,
      this.score,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reward rule batch in status draft. */
export function newRewardRuleBatch(code: string, name: string): RewardRuleBatch {
  return new RewardRuleBatch(code, name, "", 0, 0, 0, 0, "draft");
}
