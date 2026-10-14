/**
 * The global creative slot records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global creative slot is in its life cycle. */
export type GlobalCreativeSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global creative slot. Its code is unique within a tenant. */
export class GlobalCreativeSlot {
  code: string;
  label: string;
  clicks: number;
  journeyId: string;
  threshold: number;
  endsAt: number;
  cohort: string;
  status: GlobalCreativeSlotStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    journeyId: string,
    threshold: number,
    endsAt: number,
    cohort: string,
    status: GlobalCreativeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.cohort = cohort;
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

  canMoveTo(next: GlobalCreativeSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalCreativeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.threshold + this.endsAt) * 100) / 100;
  }

  copy(): GlobalCreativeSlot {
    return new GlobalCreativeSlot(
      this.code,
      this.label,
      this.clicks,
      this.journeyId,
      this.threshold,
      this.endsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global creative slot in status new. */
export function newGlobalCreativeSlot(code: string, label: string): GlobalCreativeSlot {
  return new GlobalCreativeSlot(code, label, 0, "", 0, 0, "", "new");
}
