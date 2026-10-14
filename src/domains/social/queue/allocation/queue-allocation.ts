/**
 * The queue allocation records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue allocation is in its life cycle. */
export type QueueAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a queue allocation and its current status. */
export class QueueAllocation {
  code: string;
  label: string;
  title: string;
  bid: number;
  visible: boolean;
  endsAt: number;
  weight: number;
  status: QueueAllocationStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    bid: number,
    visible: boolean,
    endsAt: number,
    weight: number,
    status: QueueAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.bid = bid;
    this.visible = visible;
    this.endsAt = endsAt;
    this.weight = weight;
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

  canMoveTo(next: QueueAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: QueueAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round(this.weight * this.endsAt * 100) / 100;
  }

  copy(): QueueAllocation {
    return new QueueAllocation(
      this.code,
      this.label,
      this.title,
      this.bid,
      this.visible,
      this.endsAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue allocation in status new. */
export function newQueueAllocation(code: string, label: string): QueueAllocation {
  return new QueueAllocation(code, label, "", 0, false, 0, 0, "new");
}
