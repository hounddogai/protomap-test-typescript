/**
 * The scheduled wait request records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled wait request is in its life cycle. */
export type ScheduledWaitRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled wait request and its current status. */
export class ScheduledWaitRequest {
  code: string;
  label: string;
  notes: string;
  checksum: string;
  locale: string;
  audienceId: string;
  clicks: number;
  openRate: number;
  status: ScheduledWaitRequestStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    checksum: string,
    locale: string,
    audienceId: string,
    clicks: number,
    openRate: number,
    status: ScheduledWaitRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.checksum = checksum;
    this.locale = locale;
    this.audienceId = audienceId;
    this.clicks = clicks;
    this.openRate = openRate;
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

  canMoveTo(next: ScheduledWaitRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWaitRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled wait request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled wait request"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate + this.clicks) * 100) / 100;
  }

  copy(): ScheduledWaitRequest {
    return new ScheduledWaitRequest(
      this.code,
      this.label,
      this.notes,
      this.checksum,
      this.locale,
      this.audienceId,
      this.clicks,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled wait request in status idle. */
export function newScheduledWaitRequest(code: string, label: string): ScheduledWaitRequest {
  return new ScheduledWaitRequest(code, label, "", "", "", "", 0, 0, "idle");
}
