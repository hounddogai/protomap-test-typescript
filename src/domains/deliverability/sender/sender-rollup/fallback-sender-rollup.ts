/**
 * The fallback sender rollup records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback sender rollup is in its life cycle. */
export type FallbackSenderRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback sender rollup and its current status. */
export class FallbackSenderRollup {
  code: string;
  label: string;
  segment: string;
  ratio: number;
  frequencyCap: number;
  status: FallbackSenderRollupStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    ratio: number,
    frequencyCap: number,
    status: FallbackSenderRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.ratio = ratio;
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

  canMoveTo(next: FallbackSenderRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackSenderRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback sender rollup"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.frequencyCap + this.ratio) * 100) / 100;
  }

  copy(): FallbackSenderRollup {
    return new FallbackSenderRollup(this.code, this.label, this.segment, this.ratio, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback sender rollup in status new. */
export function newFallbackSenderRollup(code: string, label: string): FallbackSenderRollup {
  return new FallbackSenderRollup(code, label, "", 0, 0, "new");
}
