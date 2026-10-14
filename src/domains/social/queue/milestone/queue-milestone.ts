/**
 * The queue milestone records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue milestone is in its life cycle. */
export type QueueMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a queue milestone and its current status. */
export class QueueMilestone {
  code: string;
  name: string;
  tags: string[];
  notes: string;
  ownerId: string;
  amount: number;
  status: QueueMilestoneStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    notes: string,
    ownerId: string,
    amount: number,
    status: QueueMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.notes = notes;
    this.ownerId = ownerId;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: QueueMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): QueueMilestone {
    return new QueueMilestone(this.code, this.name, this.tags, this.notes, this.ownerId, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a queue milestone in status draft. */
export function newQueueMilestone(code: string, name: string): QueueMilestone {
  return new QueueMilestone(code, name, [], "", "", 0, "draft");
}
