import * as text from "../../../../kit/text.js";

/** Where a pending pacing checkpoint is in its life cycle. */
export type PendingPacingCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending pacing checkpoint as the pacing team keeps it. */
export class PendingPacingCheckpoint {
  code: string;
  name: string;
  summary: string;
  threshold: number;
  ownerId: string;
  description: string;
  retries: number;
  channel: string;
  status: PendingPacingCheckpointStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    threshold: number,
    ownerId: string,
    description: string,
    retries: number,
    channel: string,
    status: PendingPacingCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.description = description;
    this.retries = retries;
    this.channel = channel;
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

  canMoveTo(next: PendingPacingCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: PendingPacingCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending pacing checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending pacing checkpoint"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.threshold * this.retries * 100) / 100;
  }

  copy(): PendingPacingCheckpoint {
    return new PendingPacingCheckpoint(
      this.code,
      this.name,
      this.summary,
      this.threshold,
      this.ownerId,
      this.description,
      this.retries,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending pacing checkpoint in status idle. */
export function newPendingPacingCheckpoint(code: string, name: string): PendingPacingCheckpoint {
  return new PendingPacingCheckpoint(code, name, "", 0, "", "", 0, "", "idle");
}
