import * as text from "../../../../kit/text.js";

/** Where a legacy model checkpoint is in its life cycle. */
export type LegacyModelCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy model checkpoint, with what the planners need to act on it. */
export class LegacyModelCheckpoint {
  code: string;
  label: string;
  minimum: number;
  discount: number;
  createdAt: number;
  status: LegacyModelCheckpointStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    discount: number,
    createdAt: number,
    status: LegacyModelCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.discount = discount;
    this.createdAt = createdAt;
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

  canMoveTo(next: LegacyModelCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy model checkpoint"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.minimum - this.createdAt) * 100) / 100;
  }

  copy(): LegacyModelCheckpoint {
    return new LegacyModelCheckpoint(this.code, this.label, this.minimum, this.discount, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy model checkpoint in status new. */
export function newLegacyModelCheckpoint(code: string, label: string): LegacyModelCheckpoint {
  return new LegacyModelCheckpoint(code, label, 0, 0, 0, "new");
}
