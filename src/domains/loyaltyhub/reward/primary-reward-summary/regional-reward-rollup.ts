import * as text from "../../../../kit/text.js";

/** Where a regional reward rollup is in its life cycle. */
export type RegionalRewardRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional reward rollup. Its code is unique within a tenant. */
export class RegionalRewardRollup {
  code: string;
  title: string;
  locale: string;
  score: number;
  graceDays: number;
  budget: number;
  minimum: number;
  startsAt: number;
  quantity: number;
  audienceId: string;
  ratio: number;
  status: RegionalRewardRollupStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    score: number,
    graceDays: number,
    budget: number,
    minimum: number,
    startsAt: number,
    quantity: number,
    audienceId: string,
    ratio: number,
    status: RegionalRewardRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.score = score;
    this.graceDays = graceDays;
    this.budget = budget;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalRewardRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalRewardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reward rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round((this.startsAt + this.graceDays) * 100) / 100;
  }

  copy(): RegionalRewardRollup {
    return new RegionalRewardRollup(
      this.code,
      this.title,
      this.locale,
      this.score,
      this.graceDays,
      this.budget,
      this.minimum,
      this.startsAt,
      this.quantity,
      this.audienceId,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional reward rollup in status planned. */
export function newRegionalRewardRollup(code: string, title: string): RegionalRewardRollup {
  return new RegionalRewardRollup(code, title, "", 0, 0, 0, 0, 0, 0, "", 0, "planned");
}
