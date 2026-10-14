/**
 * The level override records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level override is in its life cycle. */
export type LevelOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a level override and its current status. */
export class LevelOverride {
  code: string;
  title: string;
  reviewer: string;
  cost: number;
  weight: number;
  updatedAt: number;
  durationMinutes: number;
  locale: string;
  createdAt: number;
  minimum: number;
  ratio: number;
  status: LevelOverrideStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    cost: number,
    weight: number,
    updatedAt: number,
    durationMinutes: number,
    locale: string,
    createdAt: number,
    minimum: number,
    ratio: number,
    status: LevelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.cost = cost;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.createdAt = createdAt;
    this.minimum = minimum;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LevelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"level override"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.durationMinutes + this.minimum) * 100) / 100;
  }

  copy(): LevelOverride {
    return new LevelOverride(
      this.code,
      this.title,
      this.reviewer,
      this.cost,
      this.weight,
      this.updatedAt,
      this.durationMinutes,
      this.locale,
      this.createdAt,
      this.minimum,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a level override in status proposed. */
export function newLevelOverride(code: string, title: string): LevelOverride {
  return new LevelOverride(code, title, "", 0, 0, 0, 0, "", 0, 0, 0, "proposed");
}
