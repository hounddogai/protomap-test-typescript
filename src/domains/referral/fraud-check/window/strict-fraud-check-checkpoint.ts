import * as text from "../../../../kit/text.js";

/** Where a strict fraud check checkpoint is in its life cycle. */
export type StrictFraudCheckCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict fraud check checkpoint as the fraud check team keeps it. */
export class StrictFraudCheckCheckpoint {
  code: string;
  name: string;
  audienceId: string;
  rate: number;
  approved: boolean;
  status: StrictFraudCheckCheckpointStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    rate: number,
    approved: boolean,
    status: StrictFraudCheckCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.rate = rate;
    this.approved = approved;
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

  canMoveTo(next: StrictFraudCheckCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictFraudCheckCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict fraud check checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): StrictFraudCheckCheckpoint {
    return new StrictFraudCheckCheckpoint(this.code, this.name, this.audienceId, this.rate, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict fraud check checkpoint in status idle. */
export function newStrictFraudCheckCheckpoint(code: string, name: string): StrictFraudCheckCheckpoint {
  return new StrictFraudCheckCheckpoint(code, name, "", 0, false, "idle");
}
