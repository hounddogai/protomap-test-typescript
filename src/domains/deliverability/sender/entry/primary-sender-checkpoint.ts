import * as text from "../../../../kit/text.js";

/** Where a primary sender checkpoint is in its life cycle. */
export type PrimarySenderCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One primary sender checkpoint, with what the planners need to act on it. */
export class PrimarySenderCheckpoint {
  code: string;
  name: string;
  archived: boolean;
  campaignRef: string;
  budget: number;
  graceDays: number;
  capacity: number;
  status: PrimarySenderCheckpointStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    campaignRef: string,
    budget: number,
    graceDays: number,
    capacity: number,
    status: PrimarySenderCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.graceDays = graceDays;
    this.capacity = capacity;
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

  canMoveTo(next: PrimarySenderCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
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

  moveTo(next: PrimarySenderCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round(this.capacity * this.budget * 100) / 100;
  }

  copy(): PrimarySenderCheckpoint {
    return new PrimarySenderCheckpoint(
      this.code,
      this.name,
      this.archived,
      this.campaignRef,
      this.budget,
      this.graceDays,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary sender checkpoint in status idle. */
export function newPrimarySenderCheckpoint(code: string, name: string): PrimarySenderCheckpoint {
  return new PrimarySenderCheckpoint(code, name, false, "", 0, 0, 0, "idle");
}
