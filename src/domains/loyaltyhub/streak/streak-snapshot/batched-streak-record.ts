import * as text from "../../../../kit/text.js";

/** Where a batched streak record is in its life cycle. */
export type BatchedStreakRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One batched streak record, with what the planners need to act on it. */
export class BatchedStreakRecord {
  code: string;
  title: string;
  floorValue: number;
  label: string;
  utmSource: string;
  variant: string;
  name: string;
  revision: number;
  weight: number;
  status: BatchedStreakRecordStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    label: string,
    utmSource: string,
    variant: string,
    name: string,
    revision: number,
    weight: number,
    status: BatchedStreakRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.label = label;
    this.utmSource = utmSource;
    this.variant = variant;
    this.name = name;
    this.revision = revision;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedStreakRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedStreakRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched streak record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.weight + this.revision) * 100) / 100;
  }

  copy(): BatchedStreakRecord {
    return new BatchedStreakRecord(
      this.code,
      this.title,
      this.floorValue,
      this.label,
      this.utmSource,
      this.variant,
      this.name,
      this.revision,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched streak record in status draft. */
export function newBatchedStreakRecord(code: string, title: string): BatchedStreakRecord {
  return new BatchedStreakRecord(code, title, 0, "", "", "", "", 0, 0, "draft");
}
