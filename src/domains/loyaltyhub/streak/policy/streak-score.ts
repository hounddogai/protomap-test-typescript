import * as text from "../../../../kit/text.js";

/** Where a streak score is in its life cycle. */
export type StreakScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One streak score, with what the planners need to act on it. */
export class StreakScore {
  code: string;
  title: string;
  durationMinutes: number;
  budget: number;
  externalRef: string;
  status: StreakScoreStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    budget: number,
    externalRef: string,
    status: StreakScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.externalRef = externalRef;
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

  canMoveTo(next: StreakScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.budget + this.durationMinutes) * 100) / 100;
  }

  copy(): StreakScore {
    return new StreakScore(this.code, this.title, this.durationMinutes, this.budget, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a streak score in status draft. */
export function newStreakScore(code: string, title: string): StreakScore {
  return new StreakScore(code, title, 0, 0, "", "draft");
}
