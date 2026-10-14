import * as text from "../../../../kit/text.js";

/** Where a pending bid rule budget is in its life cycle. */
export type PendingBidRuleBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One pending bid rule budget, with what the planners need to act on it. */
export class PendingBidRuleBudget {
  code: string;
  name: string;
  active: boolean;
  audienceId: string;
  startsAt: number;
  retries: number;
  weight: number;
  durationMinutes: number;
  batchSize: number;
  version: number;
  category: string;
  status: PendingBidRuleBudgetStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    audienceId: string,
    startsAt: number,
    retries: number,
    weight: number,
    durationMinutes: number,
    batchSize: number,
    version: number,
    category: string,
    status: PendingBidRuleBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.retries = retries;
    this.weight = weight;
    this.durationMinutes = durationMinutes;
    this.batchSize = batchSize;
    this.version = version;
    this.category = category;
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

  canMoveTo(next: PendingBidRuleBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingBidRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"pending bid rule budget"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.retries + this.weight) * 100) / 100;
  }

  copy(): PendingBidRuleBudget {
    return new PendingBidRuleBudget(
      this.code,
      this.name,
      this.active,
      this.audienceId,
      this.startsAt,
      this.retries,
      this.weight,
      this.durationMinutes,
      this.batchSize,
      this.version,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending bid rule budget in status planned. */
export function newPendingBidRuleBudget(code: string, name: string): PendingBidRuleBudget {
  return new PendingBidRuleBudget(code, name, false, "", 0, 0, 0, 0, 0, 0, "", "planned");
}
