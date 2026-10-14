/**
 * The journey entry records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey entry is in its life cycle. */
export type JourneyEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey entry. Its code is unique within a tenant. */
export class JourneyEntry {
  code: string;
  label: string;
  quantity: number;
  variant: string;
  revision: number;
  segment: string;
  notes: string;
  pinned: boolean;
  score: number;
  clicks: number;
  status: JourneyEntryStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    variant: string,
    revision: number,
    segment: string,
    notes: string,
    pinned: boolean,
    score: number,
    clicks: number,
    status: JourneyEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.variant = variant;
    this.revision = revision;
    this.segment = segment;
    this.notes = notes;
    this.pinned = pinned;
    this.score = score;
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

  canMoveTo(next: JourneyEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: JourneyEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.clicks - this.quantity) * 100) / 100;
  }

  copy(): JourneyEntry {
    return new JourneyEntry(
      this.code,
      this.label,
      this.quantity,
      this.variant,
      this.revision,
      this.segment,
      this.notes,
      this.pinned,
      this.score,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a journey entry in status idle. */
export function newJourneyEntry(code: string, label: string): JourneyEntry {
  return new JourneyEntry(code, label, 0, "", 0, "", "", false, 0, 0, "idle");
}
