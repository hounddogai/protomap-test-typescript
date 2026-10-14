/**
 * The queue record records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue record is in its life cycle. */
export type QueueRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A queue record as the queue team keeps it. */
export class QueueRecord {
  code: string;
  label: string;
  currency: string;
  endsAt: number;
  limit: number;
  approved: boolean;
  active: boolean;
  sequence: number;
  utmSource: string;
  country: string;
  status: QueueRecordStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    endsAt: number,
    limit: number,
    approved: boolean,
    active: boolean,
    sequence: number,
    utmSource: string,
    country: string,
    status: QueueRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.endsAt = endsAt;
    this.limit = limit;
    this.approved = approved;
    this.active = active;
    this.sequence = sequence;
    this.utmSource = utmSource;
    this.country = country;
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

  canMoveTo(next: QueueRecordStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: QueueRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"queue record"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.limit + this.sequence) * 100) / 100;
  }

  copy(): QueueRecord {
    return new QueueRecord(
      this.code,
      this.label,
      this.currency,
      this.endsAt,
      this.limit,
      this.approved,
      this.active,
      this.sequence,
      this.utmSource,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a queue record in status open. */
export function newQueueRecord(code: string, label: string): QueueRecord {
  return new QueueRecord(code, label, "", 0, 0, false, false, 0, "", "", "open");
}
