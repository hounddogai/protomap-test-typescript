/**
 * The wait checkpoint records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait checkpoint is in its life cycle. */
export type WaitCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One wait checkpoint, with what the planners need to act on it. */
export class WaitCheckpoint {
  code: string;
  label: string;
  attempts: number;
  journeyId: string;
  active: boolean;
  channel: string;
  capacity: number;
  status: WaitCheckpointStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    journeyId: string,
    active: boolean,
    channel: string,
    capacity: number,
    status: WaitCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.active = active;
    this.channel = channel;
    this.capacity = capacity;
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

  canMoveTo(next: WaitCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: WaitCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round(this.attempts * this.capacity * 100) / 100;
  }

  copy(): WaitCheckpoint {
    return new WaitCheckpoint(
      this.code,
      this.label,
      this.attempts,
      this.journeyId,
      this.active,
      this.channel,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a wait checkpoint in status new. */
export function newWaitCheckpoint(code: string, label: string): WaitCheckpoint {
  return new WaitCheckpoint(code, label, 0, "", false, "", 0, "new");
}
