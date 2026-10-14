/**
 * The window threshold records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window threshold is in its life cycle. */
export type WindowThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One window threshold, with what the planners need to act on it. */
export class WindowThreshold {
  code: string;
  title: string;
  budget: number;
  contactEmail: string;
  cohort: string;
  sendAt: number;
  graceDays: number;
  segment: string;
  timezone: string;
  score: number;
  status: WindowThresholdStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    contactEmail: string,
    cohort: string,
    sendAt: number,
    graceDays: number,
    segment: string,
    timezone: string,
    score: number,
    status: WindowThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.segment = segment;
    this.timezone = timezone;
    this.score = score;
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

  canMoveTo(next: WindowThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WindowThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.sendAt * this.budget * 100) / 100;
  }

  copy(): WindowThreshold {
    return new WindowThreshold(
      this.code,
      this.title,
      this.budget,
      this.contactEmail,
      this.cohort,
      this.sendAt,
      this.graceDays,
      this.segment,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a window threshold in status draft. */
export function newWindowThreshold(code: string, title: string): WindowThreshold {
  return new WindowThreshold(code, title, 0, "", "", 0, 0, "", "", 0, "draft");
}
