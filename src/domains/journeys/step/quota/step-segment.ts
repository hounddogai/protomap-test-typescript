import * as text from "../../../../kit/text.js";

/** Where a step segment is in its life cycle. */
export type StepSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One step segment, with what the planners need to act on it. */
export class StepSegment {
  code: string;
  label: string;
  minimum: number;
  sendAt: number;
  currency: string;
  threshold: number;
  description: string;
  capacity: number;
  source: string;
  status: StepSegmentStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    sendAt: number,
    currency: string,
    threshold: number,
    description: string,
    capacity: number,
    source: string,
    status: StepSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.currency = currency;
    this.threshold = threshold;
    this.description = description;
    this.capacity = capacity;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"step segment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.sendAt * this.minimum * 100) / 100;
  }

  copy(): StepSegment {
    return new StepSegment(
      this.code,
      this.label,
      this.minimum,
      this.sendAt,
      this.currency,
      this.threshold,
      this.description,
      this.capacity,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a step segment in status requested. */
export function newStepSegment(code: string, label: string): StepSegment {
  return new StepSegment(code, label, 0, 0, "", 0, "", 0, "", "requested");
}
