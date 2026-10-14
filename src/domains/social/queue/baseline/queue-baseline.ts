/**
 * The queue baseline records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue baseline is in its life cycle. */
export type QueueBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** One queue baseline, with what the planners need to act on it. */
export class QueueBaseline {
  code: string;
  title: string;
  visible: boolean;
  checksum: string;
  frequencyCap: number;
  reviewer: string;
  endsAt: number;
  summary: string;
  unit: string;
  tags: string[];
  status: QueueBaselineStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    checksum: string,
    frequencyCap: number,
    reviewer: string,
    endsAt: number,
    summary: string,
    unit: string,
    tags: string[],
    status: QueueBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.summary = summary;
    this.unit = unit;
    this.tags = tags;
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

  canMoveTo(next: QueueBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round(this.frequencyCap * this.endsAt * 100) / 100;
  }

  copy(): QueueBaseline {
    return new QueueBaseline(
      this.code,
      this.title,
      this.visible,
      this.checksum,
      this.frequencyCap,
      this.reviewer,
      this.endsAt,
      this.summary,
      this.unit,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a queue baseline in status requested. */
export function newQueueBaseline(code: string, title: string): QueueBaseline {
  return new QueueBaseline(code, title, false, "", 0, "", 0, "", "", [], "requested");
}
