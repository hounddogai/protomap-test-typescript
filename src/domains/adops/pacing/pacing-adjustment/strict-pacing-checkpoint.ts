import * as text from "../../../../kit/text.js";

/** Where a strict pacing checkpoint is in its life cycle. */
export type StrictPacingCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict pacing checkpoint as the pacing team keeps it. */
export class StrictPacingCheckpoint {
  code: string;
  name: string;
  threshold: number;
  unit: string;
  audienceId: string;
  utmSource: string;
  category: string;
  quantity: number;
  status: StrictPacingCheckpointStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    unit: string,
    audienceId: string,
    utmSource: string,
    category: string,
    quantity: number,
    status: StrictPacingCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.unit = unit;
    this.audienceId = audienceId;
    this.utmSource = utmSource;
    this.category = category;
    this.quantity = quantity;
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

  canMoveTo(next: StrictPacingCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
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

  moveTo(next: StrictPacingCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict pacing checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round((this.threshold - this.quantity) * 100) / 100;
  }

  copy(): StrictPacingCheckpoint {
    return new StrictPacingCheckpoint(
      this.code,
      this.name,
      this.threshold,
      this.unit,
      this.audienceId,
      this.utmSource,
      this.category,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict pacing checkpoint in status idle. */
export function newStrictPacingCheckpoint(code: string, name: string): StrictPacingCheckpoint {
  return new StrictPacingCheckpoint(code, name, 0, "", "", "", "", 0, "idle");
}
