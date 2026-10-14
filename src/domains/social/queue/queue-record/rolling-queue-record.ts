/**
 * The rolling queue record records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling queue record is in its life cycle. */
export type RollingQueueRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling queue record. Its code is unique within a tenant. */
export class RollingQueueRecord {
  code: string;
  name: string;
  pinned: boolean;
  minimum: number;
  windowDays: number;
  reviewer: string;
  tags: string[];
  journeyId: string;
  status: RollingQueueRecordStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    minimum: number,
    windowDays: number,
    reviewer: string,
    tags: string[],
    journeyId: string,
    status: RollingQueueRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.tags = tags;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingQueueRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingQueueRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling queue record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling queue record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.windowDays + this.minimum) * 100) / 100;
  }

  copy(): RollingQueueRecord {
    return new RollingQueueRecord(
      this.code,
      this.name,
      this.pinned,
      this.minimum,
      this.windowDays,
      this.reviewer,
      this.tags,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling queue record in status open. */
export function newRollingQueueRecord(code: string, name: string): RollingQueueRecord {
  return new RollingQueueRecord(code, name, false, 0, 0, "", [], "", "open");
}
