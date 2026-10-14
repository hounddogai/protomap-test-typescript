import * as text from "../../../../kit/text.js";

/** Where a scheduled invite checkpoint is in its life cycle. */
export type ScheduledInviteCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One scheduled invite checkpoint, with what the planners need to act on it. */
export class ScheduledInviteCheckpoint {
  code: string;
  title: string;
  priority: number;
  quantity: number;
  score: number;
  batchSize: number;
  weight: number;
  threshold: number;
  status: ScheduledInviteCheckpointStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    quantity: number,
    score: number,
    batchSize: number,
    weight: number,
    threshold: number,
    status: ScheduledInviteCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.quantity = quantity;
    this.score = score;
    this.batchSize = batchSize;
    this.weight = weight;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledInviteCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledInviteCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled invite checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): ScheduledInviteCheckpoint {
    return new ScheduledInviteCheckpoint(
      this.code,
      this.title,
      this.priority,
      this.quantity,
      this.score,
      this.batchSize,
      this.weight,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled invite checkpoint in status idle. */
export function newScheduledInviteCheckpoint(code: string, title: string): ScheduledInviteCheckpoint {
  return new ScheduledInviteCheckpoint(code, title, 0, 0, 0, 0, 0, 0, "idle");
}
