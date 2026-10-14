import * as text from "../../../../kit/text.js";

/** Where a queue request is in its life cycle. */
export type QueueRequestStatus = "created" | "validated" | "published" | "retired";

/** A queue request as the queue team keeps it. */
export class QueueRequest {
  code: string;
  name: string;
  notes: string;
  durationMinutes: number;
  variant: string;
  externalRef: string;
  minimum: number;
  status: QueueRequestStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    durationMinutes: number,
    variant: string,
    externalRef: string,
    minimum: number,
    status: QueueRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.externalRef = externalRef;
    this.minimum = minimum;
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

  canMoveTo(next: QueueRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: QueueRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"queue request"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.durationMinutes - this.minimum) * 100) / 100;
  }

  copy(): QueueRequest {
    return new QueueRequest(
      this.code,
      this.name,
      this.notes,
      this.durationMinutes,
      this.variant,
      this.externalRef,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a queue request in status created. */
export function newQueueRequest(code: string, name: string): QueueRequest {
  return new QueueRequest(code, name, "", 0, "", "", 0, "created");
}
