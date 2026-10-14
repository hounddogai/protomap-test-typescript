import * as text from "../../../../kit/text.js";

/** Where a batched challenge baseline is in its life cycle. */
export type BatchedChallengeBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One batched challenge baseline, with what the planners need to act on it. */
export class BatchedChallengeBaseline {
  code: string;
  label: string;
  version: number;
  pinned: boolean;
  archived: boolean;
  status: BatchedChallengeBaselineStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    pinned: boolean,
    archived: boolean,
    status: BatchedChallengeBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.pinned = pinned;
    this.archived = archived;
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

  canMoveTo(next: BatchedChallengeBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedChallengeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched challenge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): BatchedChallengeBaseline {
    return new BatchedChallengeBaseline(this.code, this.label, this.version, this.pinned, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched challenge baseline in status idle. */
export function newBatchedChallengeBaseline(code: string, label: string): BatchedChallengeBaseline {
  return new BatchedChallengeBaseline(code, label, 0, false, false, "idle");
}
