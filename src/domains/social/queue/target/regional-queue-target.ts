/**
 * The regional queue target records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional queue target is in its life cycle. */
export type RegionalQueueTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional queue target. Its code is unique within a tenant. */
export class RegionalQueueTarget {
  code: string;
  name: string;
  sequence: number;
  priority: number;
  rate: number;
  ratio: number;
  ceiling: number;
  summary: string;
  externalRef: string;
  threshold: number;
  status: RegionalQueueTargetStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    priority: number,
    rate: number,
    ratio: number,
    ceiling: number,
    summary: string,
    externalRef: string,
    threshold: number,
    status: RegionalQueueTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.priority = priority;
    this.rate = rate;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.summary = summary;
    this.externalRef = externalRef;
    this.threshold = threshold;
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

  canMoveTo(next: RegionalQueueTargetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalQueueTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional queue target"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling + this.sequence) * 100) / 100;
  }

  copy(): RegionalQueueTarget {
    return new RegionalQueueTarget(
      this.code,
      this.name,
      this.sequence,
      this.priority,
      this.rate,
      this.ratio,
      this.ceiling,
      this.summary,
      this.externalRef,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional queue target in status new. */
export function newRegionalQueueTarget(code: string, name: string): RegionalQueueTarget {
  return new RegionalQueueTarget(code, name, 0, 0, 0, 0, 0, "", "", 0, "new");
}
