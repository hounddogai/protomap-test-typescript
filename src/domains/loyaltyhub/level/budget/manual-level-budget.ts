/**
 * The manual level budget records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual level budget is in its life cycle. */
export type ManualLevelBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual level budget, with what the planners need to act on it. */
export class ManualLevelBudget {
  code: string;
  title: string;
  region: string;
  capacity: number;
  clicks: number;
  createdAt: number;
  status: ManualLevelBudgetStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    capacity: number,
    clicks: number,
    createdAt: number,
    status: ManualLevelBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.capacity = capacity;
    this.clicks = clicks;
    this.createdAt = createdAt;
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

  canMoveTo(next: ManualLevelBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualLevelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual level budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.capacity + this.clicks) * 100) / 100;
  }

  copy(): ManualLevelBudget {
    return new ManualLevelBudget(
      this.code,
      this.title,
      this.region,
      this.capacity,
      this.clicks,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a manual level budget in status draft. */
export function newManualLevelBudget(code: string, title: string): ManualLevelBudget {
  return new ManualLevelBudget(code, title, "", 0, 0, 0, "draft");
}
