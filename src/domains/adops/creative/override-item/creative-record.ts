import * as text from "../../../../kit/text.js";

/** Where a creative record is in its life cycle. */
export type CreativeRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One creative record, with what the planners need to act on it. */
export class CreativeRecord {
  code: string;
  name: string;
  batchSize: number;
  tags: string[];
  attempts: number;
  phone: string;
  capacity: number;
  version: number;
  status: CreativeRecordStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    tags: string[],
    attempts: number,
    phone: string,
    capacity: number,
    version: number,
    status: CreativeRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.tags = tags;
    this.attempts = attempts;
    this.phone = phone;
    this.capacity = capacity;
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

  canMoveTo(next: CreativeRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.attempts + this.capacity) * 100) / 100;
  }

  copy(): CreativeRecord {
    return new CreativeRecord(
      this.code,
      this.name,
      this.batchSize,
      this.tags,
      this.attempts,
      this.phone,
      this.capacity,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative record in status planned. */
export function newCreativeRecord(code: string, name: string): CreativeRecord {
  return new CreativeRecord(code, name, 0, [], 0, "", 0, 0, "planned");
}
