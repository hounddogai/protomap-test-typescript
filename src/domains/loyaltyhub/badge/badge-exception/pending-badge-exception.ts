/**
 * The pending badge exception records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending badge exception is in its life cycle. */
export type PendingBadgeExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending badge exception and its current status. */
export class PendingBadgeException {
  code: string;
  label: string;
  margin: number;
  conversionRate: number;
  windowDays: number;
  pinned: boolean;
  active: boolean;
  status: PendingBadgeExceptionStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    conversionRate: number,
    windowDays: number,
    pinned: boolean,
    active: boolean,
    status: PendingBadgeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.active = active;
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

  canMoveTo(next: PendingBadgeExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBadgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending badge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.windowDays - this.margin) * 100) / 100;
  }

  copy(): PendingBadgeException {
    return new PendingBadgeException(
      this.code,
      this.label,
      this.margin,
      this.conversionRate,
      this.windowDays,
      this.pinned,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending badge exception in status draft. */
export function newPendingBadgeException(code: string, label: string): PendingBadgeException {
  return new PendingBadgeException(code, label, 0, 0, 0, false, false, "draft");
}
