import * as text from "../../../../kit/text.js";

/** Where a weighted reply record is in its life cycle. */
export type WeightedReplyRecordStatus = "created" | "validated" | "published" | "retired";

/** A weighted reply record as the reply team keeps it. */
export class WeightedReplyRecord {
  code: string;
  title: string;
  variant: string;
  expiresAt: number;
  capacity: number;
  retries: number;
  status: WeightedReplyRecordStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    expiresAt: number,
    capacity: number,
    retries: number,
    status: WeightedReplyRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedReplyRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedReplyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reply record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.expiresAt - this.capacity) * 100) / 100;
  }

  copy(): WeightedReplyRecord {
    return new WeightedReplyRecord(
      this.code,
      this.title,
      this.variant,
      this.expiresAt,
      this.capacity,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted reply record in status created. */
export function newWeightedReplyRecord(code: string, title: string): WeightedReplyRecord {
  return new WeightedReplyRecord(code, title, "", 0, 0, 0, "created");
}
