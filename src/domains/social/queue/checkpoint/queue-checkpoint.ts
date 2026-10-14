/**
 * The queue checkpoint records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue checkpoint is in its life cycle. */
export type QueueCheckpointStatus = "created" | "validated" | "published" | "retired";

/** One queue checkpoint, with what the planners need to act on it. */
export class QueueCheckpoint {
  code: string;
  label: string;
  region: string;
  journeyId: string;
  unit: string;
  locale: string;
  retries: number;
  minimum: number;
  summary: string;
  limit: number;
  channel: string;
  status: QueueCheckpointStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    journeyId: string,
    unit: string,
    locale: string,
    retries: number,
    minimum: number,
    summary: string,
    limit: number,
    channel: string,
    status: QueueCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.journeyId = journeyId;
    this.unit = unit;
    this.locale = locale;
    this.retries = retries;
    this.minimum = minimum;
    this.summary = summary;
    this.limit = limit;
    this.channel = channel;
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

  canMoveTo(next: QueueCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit - this.minimum) * 100) / 100;
  }

  copy(): QueueCheckpoint {
    return new QueueCheckpoint(
      this.code,
      this.label,
      this.region,
      this.journeyId,
      this.unit,
      this.locale,
      this.retries,
      this.minimum,
      this.summary,
      this.limit,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a queue checkpoint in status created. */
export function newQueueCheckpoint(code: string, label: string): QueueCheckpoint {
  return new QueueCheckpoint(code, label, "", "", "", "", 0, 0, "", 0, "", "created");
}
