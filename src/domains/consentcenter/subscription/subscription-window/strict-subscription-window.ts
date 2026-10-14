/**
 * The strict subscription window records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict subscription window is in its life cycle. */
export type StrictSubscriptionWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict subscription window, with what the planners need to act on it. */
export class StrictSubscriptionWindow {
  code: string;
  label: string;
  country: string;
  startsAt: number;
  windowDays: number;
  contactEmail: string;
  frequencyCap: number;
  status: StrictSubscriptionWindowStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    startsAt: number,
    windowDays: number,
    contactEmail: string,
    frequencyCap: number,
    status: StrictSubscriptionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: StrictSubscriptionWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: StrictSubscriptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict subscription window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.windowDays + this.startsAt) * 100) / 100;
  }

  copy(): StrictSubscriptionWindow {
    return new StrictSubscriptionWindow(
      this.code,
      this.label,
      this.country,
      this.startsAt,
      this.windowDays,
      this.contactEmail,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict subscription window in status new. */
export function newStrictSubscriptionWindow(code: string, label: string): StrictSubscriptionWindow {
  return new StrictSubscriptionWindow(code, label, "", 0, 0, "", 0, "new");
}
