/**
 * The seasonal nudge window records of growth's nudge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal nudge window is in its life cycle. */
export type SeasonalNudgeWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal nudge window and its current status. */
export class SeasonalNudgeWindow {
  code: string;
  title: string;
  ratio: number;
  graceDays: number;
  phone: string;
  budget: number;
  region: string;
  approved: boolean;
  retries: number;
  campaignRef: string;
  limit: number;
  status: SeasonalNudgeWindowStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    graceDays: number,
    phone: string,
    budget: number,
    region: string,
    approved: boolean,
    retries: number,
    campaignRef: string,
    limit: number,
    status: SeasonalNudgeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.phone = phone;
    this.budget = budget;
    this.region = region;
    this.approved = approved;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.limit = limit;
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

  canMoveTo(next: SeasonalNudgeWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalNudgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal nudge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal nudge window"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget + this.retries) * 100) / 100;
  }

  copy(): SeasonalNudgeWindow {
    return new SeasonalNudgeWindow(
      this.code,
      this.title,
      this.ratio,
      this.graceDays,
      this.phone,
      this.budget,
      this.region,
      this.approved,
      this.retries,
      this.campaignRef,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal nudge window in status planned. */
export function newSeasonalNudgeWindow(code: string, title: string): SeasonalNudgeWindow {
  return new SeasonalNudgeWindow(code, title, 0, 0, "", 0, "", false, 0, "", 0, "planned");
}
