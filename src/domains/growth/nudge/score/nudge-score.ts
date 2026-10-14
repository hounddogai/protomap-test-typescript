/**
 * The nudge score records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge score is in its life cycle. */
export type NudgeScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** One nudge score, with what the planners need to act on it. */
export class NudgeScore {
  code: string;
  title: string;
  batchSize: number;
  cohort: string;
  durationMinutes: number;
  rate: number;
  ownerId: string;
  windowDays: number;
  quantity: number;
  label: string;
  margin: number;
  status: NudgeScoreStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    cohort: string,
    durationMinutes: number,
    rate: number,
    ownerId: string,
    windowDays: number,
    quantity: number,
    label: string,
    margin: number,
    status: NudgeScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.label = label;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.rate - this.durationMinutes) * 100) / 100;
  }

  copy(): NudgeScore {
    return new NudgeScore(
      this.code,
      this.title,
      this.batchSize,
      this.cohort,
      this.durationMinutes,
      this.rate,
      this.ownerId,
      this.windowDays,
      this.quantity,
      this.label,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge score in status new. */
export function newNudgeScore(code: string, title: string): NudgeScore {
  return new NudgeScore(code, title, 0, "", 0, 0, "", 0, 0, "", 0, "new");
}
