/**
 * The adaptive cohort score records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive cohort score is in its life cycle. */
export type AdaptiveCohortScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a adaptive cohort score and its current status. */
export class AdaptiveCohortScore {
  code: string;
  label: string;
  quantity: number;
  clicks: number;
  audienceId: string;
  startsAt: number;
  maximum: number;
  rate: number;
  cost: number;
  archived: boolean;
  utmSource: string;
  status: AdaptiveCohortScoreStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    clicks: number,
    audienceId: string,
    startsAt: number,
    maximum: number,
    rate: number,
    cost: number,
    archived: boolean,
    utmSource: string,
    status: AdaptiveCohortScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.clicks = clicks;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.rate = rate;
    this.cost = cost;
    this.archived = archived;
    this.utmSource = utmSource;
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

  canMoveTo(next: AdaptiveCohortScoreStatus): boolean {
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
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveCohortScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive cohort score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round(this.maximum * this.rate * 100) / 100;
  }

  copy(): AdaptiveCohortScore {
    return new AdaptiveCohortScore(
      this.code,
      this.label,
      this.quantity,
      this.clicks,
      this.audienceId,
      this.startsAt,
      this.maximum,
      this.rate,
      this.cost,
      this.archived,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive cohort score in status planned. */
export function newAdaptiveCohortScore(code: string, label: string): AdaptiveCohortScore {
  return new AdaptiveCohortScore(code, label, 0, 0, "", 0, 0, 0, 0, false, "", "planned");
}
