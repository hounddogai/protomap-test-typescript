import * as text from "../../../../kit/text.js";

/** Where a strict sender segment is in its life cycle. */
export type StrictSenderSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict sender segment. Its code is unique within a tenant. */
export class StrictSenderSegment {
  code: string;
  title: string;
  currency: string;
  campaignRef: string;
  externalRef: string;
  minimum: number;
  ownerId: string;
  capacity: number;
  status: StrictSenderSegmentStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    campaignRef: string,
    externalRef: string,
    minimum: number,
    ownerId: string,
    capacity: number,
    status: StrictSenderSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.ownerId = ownerId;
    this.capacity = capacity;
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

  canMoveTo(next: StrictSenderSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: StrictSenderSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sender segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.minimum + this.capacity) * 100) / 100;
  }

  copy(): StrictSenderSegment {
    return new StrictSenderSegment(
      this.code,
      this.title,
      this.currency,
      this.campaignRef,
      this.externalRef,
      this.minimum,
      this.ownerId,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict sender segment in status planned. */
export function newStrictSenderSegment(code: string, title: string): StrictSenderSegment {
  return new StrictSenderSegment(code, title, "", "", "", 0, "", 0, "planned");
}
