/**
 * The capped pacing estimate records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped pacing estimate is in its life cycle. */
export type CappedPacingEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped pacing estimate and its current status. */
export class CappedPacingEstimate {
  code: string;
  title: string;
  unit: string;
  locale: string;
  attempts: number;
  bid: number;
  description: string;
  floorValue: number;
  version: number;
  graceDays: number;
  status: CappedPacingEstimateStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    locale: string,
    attempts: number,
    bid: number,
    description: string,
    floorValue: number,
    version: number,
    graceDays: number,
    status: CappedPacingEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.locale = locale;
    this.attempts = attempts;
    this.bid = bid;
    this.description = description;
    this.floorValue = floorValue;
    this.version = version;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPacingEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedPacingEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped pacing estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.graceDays - this.floorValue) * 100) / 100;
  }

  copy(): CappedPacingEstimate {
    return new CappedPacingEstimate(
      this.code,
      this.title,
      this.unit,
      this.locale,
      this.attempts,
      this.bid,
      this.description,
      this.floorValue,
      this.version,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped pacing estimate in status idle. */
export function newCappedPacingEstimate(code: string, title: string): CappedPacingEstimate {
  return new CappedPacingEstimate(code, title, "", "", 0, 0, "", 0, 0, 0, "idle");
}
