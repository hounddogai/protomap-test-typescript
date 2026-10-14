/**
 * The redemption window records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption window is in its life cycle. */
export type RedemptionWindowStatus = "created" | "validated" | "published" | "retired";

/** The record of a redemption window and its current status. */
export class RedemptionWindow {
  code: string;
  title: string;
  batchSize: number;
  summary: string;
  country: string;
  weight: number;
  cohort: string;
  durationMinutes: number;
  endsAt: number;
  conversionRate: number;
  status: RedemptionWindowStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    summary: string,
    country: string,
    weight: number,
    cohort: string,
    durationMinutes: number,
    endsAt: number,
    conversionRate: number,
    status: RedemptionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.summary = summary;
    this.country = country;
    this.weight = weight;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RedemptionWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RedemptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"redemption window"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.batchSize * this.weight * 100) / 100;
  }

  copy(): RedemptionWindow {
    return new RedemptionWindow(
      this.code,
      this.title,
      this.batchSize,
      this.summary,
      this.country,
      this.weight,
      this.cohort,
      this.durationMinutes,
      this.endsAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a redemption window in status created. */
export function newRedemptionWindow(code: string, title: string): RedemptionWindow {
  return new RedemptionWindow(code, title, 0, "", "", 0, "", 0, 0, 0, "created");
}
