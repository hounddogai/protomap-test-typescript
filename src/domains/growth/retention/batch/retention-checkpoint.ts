import * as text from "../../../../kit/text.js";

/** Where a retention checkpoint is in its life cycle. */
export type RetentionCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One retention checkpoint, with what the planners need to act on it. */
export class RetentionCheckpoint {
  code: string;
  label: string;
  endsAt: number;
  sequence: number;
  windowDays: number;
  budget: number;
  limit: number;
  status: RetentionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    sequence: number,
    windowDays: number,
    budget: number,
    limit: number,
    status: RetentionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.windowDays = windowDays;
    this.budget = budget;
    this.limit = limit;
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

  canMoveTo(next: RetentionCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
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

  moveTo(next: RetentionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"retention checkpoint"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.budget + this.windowDays) * 100) / 100;
  }

  copy(): RetentionCheckpoint {
    return new RetentionCheckpoint(
      this.code,
      this.label,
      this.endsAt,
      this.sequence,
      this.windowDays,
      this.budget,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a retention checkpoint in status new. */
export function newRetentionCheckpoint(code: string, label: string): RetentionCheckpoint {
  return new RetentionCheckpoint(code, label, 0, 0, 0, 0, 0, "new");
}
