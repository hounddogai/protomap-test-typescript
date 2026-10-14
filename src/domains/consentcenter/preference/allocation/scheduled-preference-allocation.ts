/**
 * The scheduled preference allocation records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled preference allocation is in its life cycle. */
export type ScheduledPreferenceAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled preference allocation as the preference team keeps it. */
export class ScheduledPreferenceAllocation {
  code: string;
  title: string;
  archived: boolean;
  summary: string;
  channel: string;
  contactEmail: string;
  amount: number;
  attempts: number;
  status: ScheduledPreferenceAllocationStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    summary: string,
    channel: string,
    contactEmail: string,
    amount: number,
    attempts: number,
    status: ScheduledPreferenceAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.summary = summary;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.attempts = attempts;
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

  canMoveTo(next: ScheduledPreferenceAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPreferenceAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled preference allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled preference allocation"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.attempts * this.amount * 100) / 100;
  }

  copy(): ScheduledPreferenceAllocation {
    return new ScheduledPreferenceAllocation(
      this.code,
      this.title,
      this.archived,
      this.summary,
      this.channel,
      this.contactEmail,
      this.amount,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled preference allocation in status idle. */
export function newScheduledPreferenceAllocation(code: string, title: string): ScheduledPreferenceAllocation {
  return new ScheduledPreferenceAllocation(code, title, false, "", "", "", 0, 0, "idle");
}
