import * as text from "../../../../kit/text.js";

/** Where a capped queue record is in its life cycle. */
export type CappedQueueRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One capped queue record, with what the planners need to act on it. */
export class CappedQueueRecord {
  code: string;
  title: string;
  cost: number;
  createdAt: number;
  source: string;
  sequence: number;
  weight: number;
  windowDays: number;
  version: number;
  status: CappedQueueRecordStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    createdAt: number,
    source: string,
    sequence: number,
    weight: number,
    windowDays: number,
    version: number,
    status: CappedQueueRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.createdAt = createdAt;
    this.source = source;
    this.sequence = sequence;
    this.weight = weight;
    this.windowDays = windowDays;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedQueueRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedQueueRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped queue record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.cost + this.version) * 100) / 100;
  }

  copy(): CappedQueueRecord {
    return new CappedQueueRecord(
      this.code,
      this.title,
      this.cost,
      this.createdAt,
      this.source,
      this.sequence,
      this.weight,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped queue record in status planned. */
export function newCappedQueueRecord(code: string, title: string): CappedQueueRecord {
  return new CappedQueueRecord(code, title, 0, 0, "", 0, 0, 0, 0, "planned");
}
