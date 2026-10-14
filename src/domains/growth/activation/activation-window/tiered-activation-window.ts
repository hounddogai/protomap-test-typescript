/**
 * The tiered activation window records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered activation window is in its life cycle. */
export type TieredActivationWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tiered activation window, with what the planners need to act on it. */
export class TieredActivationWindow {
  code: string;
  title: string;
  durationMinutes: number;
  sendAt: number;
  locale: string;
  status: TieredActivationWindowStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    sendAt: number,
    locale: string,
    status: TieredActivationWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.locale = locale;
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

  canMoveTo(next: TieredActivationWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredActivationWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered activation window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.durationMinutes + this.sendAt) * 100) / 100;
  }

  copy(): TieredActivationWindow {
    return new TieredActivationWindow(
      this.code,
      this.title,
      this.durationMinutes,
      this.sendAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered activation window in status draft. */
export function newTieredActivationWindow(code: string, title: string): TieredActivationWindow {
  return new TieredActivationWindow(code, title, 0, 0, "", "draft");
}
