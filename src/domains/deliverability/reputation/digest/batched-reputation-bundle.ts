import * as text from "../../../../kit/text.js";

/** Where a batched reputation bundle is in its life cycle. */
export type BatchedReputationBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched reputation bundle and its current status. */
export class BatchedReputationBundle {
  code: string;
  title: string;
  segment: string;
  region: string;
  sendAt: number;
  archived: boolean;
  score: number;
  minimum: number;
  budget: number;
  locale: string;
  status: BatchedReputationBundleStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    region: string,
    sendAt: number,
    archived: boolean,
    score: number,
    minimum: number,
    budget: number,
    locale: string,
    status: BatchedReputationBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.region = region;
    this.sendAt = sendAt;
    this.archived = archived;
    this.score = score;
    this.minimum = minimum;
    this.budget = budget;
    this.locale = locale;
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

  canMoveTo(next: BatchedReputationBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: BatchedReputationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reputation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.minimum * this.sendAt * 100) / 100;
  }

  copy(): BatchedReputationBundle {
    return new BatchedReputationBundle(
      this.code,
      this.title,
      this.segment,
      this.region,
      this.sendAt,
      this.archived,
      this.score,
      this.minimum,
      this.budget,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched reputation bundle in status idle. */
export function newBatchedReputationBundle(code: string, title: string): BatchedReputationBundle {
  return new BatchedReputationBundle(code, title, "", "", 0, false, 0, 0, 0, "", "idle");
}
