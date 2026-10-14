import * as text from "../../../../kit/text.js";

/** Where a journey record is in its life cycle. */
export type JourneyRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a journey record and its current status. */
export class JourneyRecord {
  code: string;
  label: string;
  ownerId: string;
  cost: number;
  capacity: number;
  description: string;
  tags: string[];
  checksum: string;
  clicks: number;
  status: JourneyRecordStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    cost: number,
    capacity: number,
    description: string,
    tags: string[],
    checksum: string,
    clicks: number,
    status: JourneyRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.cost = cost;
    this.capacity = capacity;
    this.description = description;
    this.tags = tags;
    this.checksum = checksum;
    this.clicks = clicks;
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

  canMoveTo(next: JourneyRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: JourneyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.clicks + this.capacity) * 100) / 100;
  }

  copy(): JourneyRecord {
    return new JourneyRecord(
      this.code,
      this.label,
      this.ownerId,
      this.cost,
      this.capacity,
      this.description,
      this.tags,
      this.checksum,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey record in status new. */
export function newJourneyRecord(code: string, label: string): JourneyRecord {
  return new JourneyRecord(code, label, "", 0, 0, "", [], "", 0, "new");
}
