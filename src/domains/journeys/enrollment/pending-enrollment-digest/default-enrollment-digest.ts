/**
 * The default enrollment digest records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default enrollment digest is in its life cycle. */
export type DefaultEnrollmentDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One default enrollment digest, with what the planners need to act on it. */
export class DefaultEnrollmentDigest {
  code: string;
  title: string;
  openRate: number;
  segment: string;
  cost: number;
  retries: number;
  startsAt: number;
  priority: number;
  conversionRate: number;
  floorValue: number;
  pinned: boolean;
  status: DefaultEnrollmentDigestStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    segment: string,
    cost: number,
    retries: number,
    startsAt: number,
    priority: number,
    conversionRate: number,
    floorValue: number,
    pinned: boolean,
    status: DefaultEnrollmentDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.segment = segment;
    this.cost = cost;
    this.retries = retries;
    this.startsAt = startsAt;
    this.priority = priority;
    this.conversionRate = conversionRate;
    this.floorValue = floorValue;
    this.pinned = pinned;
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

  canMoveTo(next: DefaultEnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultEnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.floorValue + this.priority) * 100) / 100;
  }

  copy(): DefaultEnrollmentDigest {
    return new DefaultEnrollmentDigest(
      this.code,
      this.title,
      this.openRate,
      this.segment,
      this.cost,
      this.retries,
      this.startsAt,
      this.priority,
      this.conversionRate,
      this.floorValue,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default enrollment digest in status new. */
export function newDefaultEnrollmentDigest(code: string, title: string): DefaultEnrollmentDigest {
  return new DefaultEnrollmentDigest(code, title, 0, "", 0, 0, 0, 0, 0, 0, false, "new");
}
