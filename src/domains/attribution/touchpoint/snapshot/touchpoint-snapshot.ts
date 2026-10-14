/**
 * The touchpoint snapshot records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint snapshot is in its life cycle. */
export type TouchpointSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** One touchpoint snapshot, with what the planners need to act on it. */
export class TouchpointSnapshot {
  code: string;
  name: string;
  durationMinutes: number;
  source: string;
  variant: string;
  windowDays: number;
  locale: string;
  graceDays: number;
  createdAt: number;
  amount: number;
  currency: string;
  status: TouchpointSnapshotStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    source: string,
    variant: string,
    windowDays: number,
    locale: string,
    graceDays: number,
    createdAt: number,
    amount: number,
    currency: string,
    status: TouchpointSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.variant = variant;
    this.windowDays = windowDays;
    this.locale = locale;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.amount = amount;
    this.currency = currency;
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

  canMoveTo(next: TouchpointSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: TouchpointSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round(this.createdAt * this.graceDays * 100) / 100;
  }

  copy(): TouchpointSnapshot {
    return new TouchpointSnapshot(
      this.code,
      this.name,
      this.durationMinutes,
      this.source,
      this.variant,
      this.windowDays,
      this.locale,
      this.graceDays,
      this.createdAt,
      this.amount,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a touchpoint snapshot in status requested. */
export function newTouchpointSnapshot(code: string, name: string): TouchpointSnapshot {
  return new TouchpointSnapshot(code, name, 0, "", "", 0, "", 0, 0, 0, "", "requested");
}
