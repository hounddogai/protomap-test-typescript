/**
 * The scheduled window notice records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled window notice is in its life cycle. */
export type ScheduledWindowNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled window notice and its current status. */
export class ScheduledWindowNotice {
  code: string;
  label: string;
  name: string;
  externalRef: string;
  region: string;
  contactEmail: string;
  graceDays: number;
  ceiling: number;
  budget: number;
  startsAt: number;
  currency: string;
  status: ScheduledWindowNoticeStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    externalRef: string,
    region: string,
    contactEmail: string,
    graceDays: number,
    ceiling: number,
    budget: number,
    startsAt: number,
    currency: string,
    status: ScheduledWindowNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.externalRef = externalRef;
    this.region = region;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.ceiling = ceiling;
    this.budget = budget;
    this.startsAt = startsAt;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWindowNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledWindowNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled window notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled window notice"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.ceiling + this.startsAt) * 100) / 100;
  }

  copy(): ScheduledWindowNotice {
    return new ScheduledWindowNotice(
      this.code,
      this.label,
      this.name,
      this.externalRef,
      this.region,
      this.contactEmail,
      this.graceDays,
      this.ceiling,
      this.budget,
      this.startsAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled window notice in status open. */
export function newScheduledWindowNotice(code: string, label: string): ScheduledWindowNotice {
  return new ScheduledWindowNotice(code, label, "", "", "", "", 0, 0, 0, 0, "", "open");
}
