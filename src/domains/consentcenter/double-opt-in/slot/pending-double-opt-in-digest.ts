import * as text from "../../../../kit/text.js";

/** Where a pending double opt in digest is in its life cycle. */
export type PendingDoubleOptInDigestStatus = "created" | "validated" | "published" | "retired";

/** One pending double opt in digest, with what the planners need to act on it. */
export class PendingDoubleOptInDigest {
  code: string;
  label: string;
  limit: number;
  segment: string;
  capacity: number;
  timezone: string;
  status: PendingDoubleOptInDigestStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    segment: string,
    capacity: number,
    timezone: string,
    status: PendingDoubleOptInDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.segment = segment;
    this.capacity = capacity;
    this.timezone = timezone;
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

  canMoveTo(next: PendingDoubleOptInDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingDoubleOptInDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending double opt in digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending double opt in digest"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.capacity + this.limit) * 100) / 100;
  }

  copy(): PendingDoubleOptInDigest {
    return new PendingDoubleOptInDigest(
      this.code,
      this.label,
      this.limit,
      this.segment,
      this.capacity,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending double opt in digest in status created. */
export function newPendingDoubleOptInDigest(code: string, label: string): PendingDoubleOptInDigest {
  return new PendingDoubleOptInDigest(code, label, 0, "", 0, "", "created");
}
