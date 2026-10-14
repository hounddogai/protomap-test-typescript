/**
 * The batched pacing mapping records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched pacing mapping is in its life cycle. */
export type BatchedPacingMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched pacing mapping as the pacing team keeps it. */
export class BatchedPacingMapping {
  code: string;
  title: string;
  priority: number;
  campaignRef: string;
  pinned: boolean;
  retries: number;
  status: BatchedPacingMappingStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    campaignRef: string,
    pinned: boolean,
    retries: number,
    status: BatchedPacingMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.retries = retries;
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

  canMoveTo(next: BatchedPacingMappingStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedPacingMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched pacing mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched pacing mapping"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.priority * this.retries * 100) / 100;
  }

  copy(): BatchedPacingMapping {
    return new BatchedPacingMapping(
      this.code,
      this.title,
      this.priority,
      this.campaignRef,
      this.pinned,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched pacing mapping in status new. */
export function newBatchedPacingMapping(code: string, title: string): BatchedPacingMapping {
  return new BatchedPacingMapping(code, title, 0, "", false, 0, "new");
}
