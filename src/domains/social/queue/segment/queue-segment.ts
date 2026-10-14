/**
 * The queue segment records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue segment is in its life cycle. */
export type QueueSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a queue segment and its current status. */
export class QueueSegment {
  code: string;
  title: string;
  discount: number;
  minimum: number;
  approved: boolean;
  segment: string;
  region: string;
  unit: string;
  status: QueueSegmentStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    minimum: number,
    approved: boolean,
    segment: string,
    region: string,
    unit: string,
    status: QueueSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.minimum = minimum;
    this.approved = approved;
    this.segment = segment;
    this.region = region;
    this.unit = unit;
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

  canMoveTo(next: QueueSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"queue segment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount - this.minimum) * 100) / 100;
  }

  copy(): QueueSegment {
    return new QueueSegment(
      this.code,
      this.title,
      this.discount,
      this.minimum,
      this.approved,
      this.segment,
      this.region,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a queue segment in status created. */
export function newQueueSegment(code: string, title: string): QueueSegment {
  return new QueueSegment(code, title, 0, 0, false, "", "", "", "created");
}
