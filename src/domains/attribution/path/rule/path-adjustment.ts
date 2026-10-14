import * as text from "../../../../kit/text.js";

/** Where a path adjustment is in its life cycle. */
export type PathAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A path adjustment as the path team keeps it. */
export class PathAdjustment {
  code: string;
  label: string;
  capacity: number;
  variant: string;
  batchSize: number;
  status: PathAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    variant: string,
    batchSize: number,
    status: PathAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.variant = variant;
    this.batchSize = batchSize;
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

  canMoveTo(next: PathAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"path adjustment"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.capacity + this.batchSize) * 100) / 100;
  }

  copy(): PathAdjustment {
    return new PathAdjustment(this.code, this.label, this.capacity, this.variant, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a path adjustment in status new. */
export function newPathAdjustment(code: string, label: string): PathAdjustment {
  return new PathAdjustment(code, label, 0, "", 0, "new");
}
