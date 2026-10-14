/**
 * The adaptive deflection budget records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive deflection budget is in its life cycle. */
export type AdaptiveDeflectionBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive deflection budget and its current status. */
export class AdaptiveDeflectionBudget {
  code: string;
  title: string;
  sendAt: number;
  approved: boolean;
  startsAt: number;
  updatedAt: number;
  discount: number;
  durationMinutes: number;
  createdAt: number;
  expiresAt: number;
  status: AdaptiveDeflectionBudgetStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    approved: boolean,
    startsAt: number,
    updatedAt: number,
    discount: number,
    durationMinutes: number,
    createdAt: number,
    expiresAt: number,
    status: AdaptiveDeflectionBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.approved = approved;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: AdaptiveDeflectionBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveDeflectionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive deflection budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round((this.expiresAt - this.discount) * 100) / 100;
  }

  copy(): AdaptiveDeflectionBudget {
    return new AdaptiveDeflectionBudget(
      this.code,
      this.title,
      this.sendAt,
      this.approved,
      this.startsAt,
      this.updatedAt,
      this.discount,
      this.durationMinutes,
      this.createdAt,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive deflection budget in status proposed. */
export function newAdaptiveDeflectionBudget(code: string, title: string): AdaptiveDeflectionBudget {
  return new AdaptiveDeflectionBudget(code, title, 0, false, 0, 0, 0, 0, 0, 0, "proposed");
}
