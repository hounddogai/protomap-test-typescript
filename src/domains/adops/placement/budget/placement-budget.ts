/**
 * The placement budget records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement budget is in its life cycle. */
export type PlacementBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a placement budget and its current status. */
export class PlacementBudget {
  code: string;
  title: string;
  frequencyCap: number;
  budget: number;
  expiresAt: number;
  audienceId: string;
  durationMinutes: number;
  maximum: number;
  approved: boolean;
  attempts: number;
  updatedAt: number;
  status: PlacementBudgetStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    budget: number,
    expiresAt: number,
    audienceId: string,
    durationMinutes: number,
    maximum: number,
    approved: boolean,
    attempts: number,
    updatedAt: number,
    status: PlacementBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.audienceId = audienceId;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.approved = approved;
    this.attempts = attempts;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PlacementBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PlacementBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.updatedAt + this.attempts) * 100) / 100;
  }

  copy(): PlacementBudget {
    return new PlacementBudget(
      this.code,
      this.title,
      this.frequencyCap,
      this.budget,
      this.expiresAt,
      this.audienceId,
      this.durationMinutes,
      this.maximum,
      this.approved,
      this.attempts,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement budget in status requested. */
export function newPlacementBudget(code: string, title: string): PlacementBudget {
  return new PlacementBudget(code, title, 0, 0, 0, "", 0, 0, false, 0, 0, "requested");
}
