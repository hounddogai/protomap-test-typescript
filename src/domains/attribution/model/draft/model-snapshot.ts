import * as text from "../../../../kit/text.js";

/** Where a model snapshot is in its life cycle. */
export type ModelSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One model snapshot, with what the planners need to act on it. */
export class ModelSnapshot {
  code: string;
  label: string;
  limit: number;
  graceDays: number;
  description: string;
  variant: string;
  timezone: string;
  status: ModelSnapshotStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    graceDays: number,
    description: string,
    variant: string,
    timezone: string,
    status: ModelSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.graceDays = graceDays;
    this.description = description;
    this.variant = variant;
    this.timezone = timezone;
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

  canMoveTo(next: ModelSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ModelSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"model snapshot"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.limit * this.graceDays * 100) / 100;
  }

  copy(): ModelSnapshot {
    return new ModelSnapshot(
      this.code,
      this.label,
      this.limit,
      this.graceDays,
      this.description,
      this.variant,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model snapshot in status new. */
export function newModelSnapshot(code: string, label: string): ModelSnapshot {
  return new ModelSnapshot(code, label, 0, 0, "", "", "", "new");
}
