/**
 * The primary reply budget records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary reply budget is in its life cycle. */
export type PrimaryReplyBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary reply budget and its current status. */
export class PrimaryReplyBudget {
  code: string;
  title: string;
  ownerId: string;
  endsAt: number;
  impressions: number;
  status: PrimaryReplyBudgetStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    endsAt: number,
    impressions: number,
    status: PrimaryReplyBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.endsAt = endsAt;
    this.impressions = impressions;
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

  canMoveTo(next: PrimaryReplyBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryReplyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reply budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.endsAt * this.impressions * 100) / 100;
  }

  copy(): PrimaryReplyBudget {
    return new PrimaryReplyBudget(this.code, this.title, this.ownerId, this.endsAt, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary reply budget in status planned. */
export function newPrimaryReplyBudget(code: string, title: string): PrimaryReplyBudget {
  return new PrimaryReplyBudget(code, title, "", 0, 0, "planned");
}
