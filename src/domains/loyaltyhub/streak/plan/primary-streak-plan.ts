/**
 * The primary streak plan records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary streak plan is in its life cycle. */
export type PrimaryStreakPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** One primary streak plan, with what the planners need to act on it. */
export class PrimaryStreakPlan {
  code: string;
  title: string;
  rate: number;
  createdAt: number;
  externalRef: string;
  conversionRate: number;
  discount: number;
  audienceId: string;
  limit: number;
  category: string;
  durationMinutes: number;
  status: PrimaryStreakPlanStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    createdAt: number,
    externalRef: string,
    conversionRate: number,
    discount: number,
    audienceId: string,
    limit: number,
    category: string,
    durationMinutes: number,
    status: PrimaryStreakPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.audienceId = audienceId;
    this.limit = limit;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryStreakPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryStreakPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary streak plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt - this.limit) * 100) / 100;
  }

  copy(): PrimaryStreakPlan {
    return new PrimaryStreakPlan(
      this.code,
      this.title,
      this.rate,
      this.createdAt,
      this.externalRef,
      this.conversionRate,
      this.discount,
      this.audienceId,
      this.limit,
      this.category,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary streak plan in status requested. */
export function newPrimaryStreakPlan(code: string, title: string): PrimaryStreakPlan {
  return new PrimaryStreakPlan(code, title, 0, 0, "", 0, 0, "", 0, "", 0, "requested");
}
