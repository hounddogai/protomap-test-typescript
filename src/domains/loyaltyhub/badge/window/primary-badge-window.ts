/**
 * The primary badge window records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary badge window is in its life cycle. */
export type PrimaryBadgeWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One primary badge window, with what the planners need to act on it. */
export class PrimaryBadgeWindow {
  code: string;
  name: string;
  channel: string;
  timezone: string;
  revision: number;
  graceDays: number;
  notes: string;
  country: string;
  clicks: number;
  threshold: number;
  status: PrimaryBadgeWindowStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    timezone: string,
    revision: number,
    graceDays: number,
    notes: string,
    country: string,
    clicks: number,
    threshold: number,
    status: PrimaryBadgeWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.timezone = timezone;
    this.revision = revision;
    this.graceDays = graceDays;
    this.notes = notes;
    this.country = country;
    this.clicks = clicks;
    this.threshold = threshold;
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

  canMoveTo(next: PrimaryBadgeWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryBadgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary badge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.revision + this.clicks) * 100) / 100;
  }

  copy(): PrimaryBadgeWindow {
    return new PrimaryBadgeWindow(
      this.code,
      this.name,
      this.channel,
      this.timezone,
      this.revision,
      this.graceDays,
      this.notes,
      this.country,
      this.clicks,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary badge window in status idle. */
export function newPrimaryBadgeWindow(code: string, name: string): PrimaryBadgeWindow {
  return new PrimaryBadgeWindow(code, name, "", "", 0, 0, "", "", 0, 0, "idle");
}
