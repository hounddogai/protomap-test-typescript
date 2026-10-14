/**
 * The strict opt out batch records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict opt out batch is in its life cycle. */
export type StrictOptOutBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict opt out batch, with what the planners need to act on it. */
export class StrictOptOutBatch {
  code: string;
  title: string;
  contactEmail: string;
  name: string;
  pinned: boolean;
  version: number;
  budget: number;
  margin: number;
  conversionRate: number;
  clicks: number;
  status: StrictOptOutBatchStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    name: string,
    pinned: boolean,
    version: number,
    budget: number,
    margin: number,
    conversionRate: number,
    clicks: number,
    status: StrictOptOutBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.name = name;
    this.pinned = pinned;
    this.version = version;
    this.budget = budget;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
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

  canMoveTo(next: StrictOptOutBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictOptOutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict opt out batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.margin) * 100) / 100;
  }

  copy(): StrictOptOutBatch {
    return new StrictOptOutBatch(
      this.code,
      this.title,
      this.contactEmail,
      this.name,
      this.pinned,
      this.version,
      this.budget,
      this.margin,
      this.conversionRate,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict opt out batch in status idle. */
export function newStrictOptOutBatch(code: string, title: string): StrictOptOutBatch {
  return new StrictOptOutBatch(code, title, "", "", false, 0, 0, 0, 0, 0, "idle");
}
