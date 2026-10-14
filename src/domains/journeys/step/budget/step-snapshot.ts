import * as text from "../../../../kit/text.js";

/** Where a step snapshot is in its life cycle. */
export type StepSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a step snapshot and its current status. */
export class StepSnapshot {
  code: string;
  name: string;
  utmSource: string;
  phone: string;
  batchSize: number;
  status: StepSnapshotStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    phone: string,
    batchSize: number,
    status: StepSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.phone = phone;
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

  canMoveTo(next: StepSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StepSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"step snapshot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): StepSnapshot {
    return new StepSnapshot(this.code, this.name, this.utmSource, this.phone, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step snapshot in status new. */
export function newStepSnapshot(code: string, name: string): StepSnapshot {
  return new StepSnapshot(code, name, "", "", 0, "new");
}
