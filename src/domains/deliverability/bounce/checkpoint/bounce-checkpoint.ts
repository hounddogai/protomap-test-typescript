/**
 * The bounce checkpoint records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce checkpoint is in its life cycle. */
export type BounceCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a bounce checkpoint and its current status. */
export class BounceCheckpoint {
  code: string;
  label: string;
  impressions: number;
  campaignRef: string;
  quantity: number;
  threshold: number;
  graceDays: number;
  visible: boolean;
  status: BounceCheckpointStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    campaignRef: string,
    quantity: number,
    threshold: number,
    graceDays: number,
    visible: boolean,
    status: BounceCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.visible = visible;
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

  canMoveTo(next: BounceCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.threshold + this.quantity) * 100) / 100;
  }

  copy(): BounceCheckpoint {
    return new BounceCheckpoint(
      this.code,
      this.label,
      this.impressions,
      this.campaignRef,
      this.quantity,
      this.threshold,
      this.graceDays,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce checkpoint in status new. */
export function newBounceCheckpoint(code: string, label: string): BounceCheckpoint {
  return new BounceCheckpoint(code, label, 0, "", 0, 0, 0, false, "new");
}
