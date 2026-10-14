import * as text from "../../../../kit/text.js";

/** Where a reward rule request is in its life cycle. */
export type RewardRuleRequestStatus = "created" | "validated" | "published" | "retired";

/** One reward rule request, with what the planners need to act on it. */
export class RewardRuleRequest {
  code: string;
  title: string;
  locale: string;
  durationMinutes: number;
  utmSource: string;
  limit: number;
  graceDays: number;
  cost: number;
  status: RewardRuleRequestStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    durationMinutes: number,
    utmSource: string,
    limit: number,
    graceDays: number,
    cost: number,
    status: RewardRuleRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.limit = limit;
    this.graceDays = graceDays;
    this.cost = cost;
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

  canMoveTo(next: RewardRuleRequestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule request"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.graceDays * this.cost * 100) / 100;
  }

  copy(): RewardRuleRequest {
    return new RewardRuleRequest(
      this.code,
      this.title,
      this.locale,
      this.durationMinutes,
      this.utmSource,
      this.limit,
      this.graceDays,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule request in status created. */
export function newRewardRuleRequest(code: string, title: string): RewardRuleRequest {
  return new RewardRuleRequest(code, title, "", 0, "", 0, 0, 0, "created");
}
