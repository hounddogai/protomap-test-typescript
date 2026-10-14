/**
 * The touchpoint adjustment records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint adjustment is in its life cycle. */
export type TouchpointAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A touchpoint adjustment as the touchpoint team keeps it. */
export class TouchpointAdjustment {
  code: string;
  title: string;
  reviewer: string;
  phone: string;
  priority: number;
  unit: string;
  timezone: string;
  segment: string;
  clicks: number;
  endsAt: number;
  channel: string;
  status: TouchpointAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    phone: string,
    priority: number,
    unit: string,
    timezone: string,
    segment: string,
    clicks: number,
    endsAt: number,
    channel: string,
    status: TouchpointAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.phone = phone;
    this.priority = priority;
    this.unit = unit;
    this.timezone = timezone;
    this.segment = segment;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.channel = channel;
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

  canMoveTo(next: TouchpointAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.priority + this.endsAt) * 100) / 100;
  }

  copy(): TouchpointAdjustment {
    return new TouchpointAdjustment(
      this.code,
      this.title,
      this.reviewer,
      this.phone,
      this.priority,
      this.unit,
      this.timezone,
      this.segment,
      this.clicks,
      this.endsAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a touchpoint adjustment in status new. */
export function newTouchpointAdjustment(code: string, title: string): TouchpointAdjustment {
  return new TouchpointAdjustment(code, title, "", "", 0, "", "", "", 0, 0, "", "new");
}
