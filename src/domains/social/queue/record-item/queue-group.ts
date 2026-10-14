import * as text from "../../../../kit/text.js";

/** Where a queue group is in its life cycle. */
export type QueueGroupStatus = "created" | "validated" | "published" | "retired";

/** A queue group as the queue team keeps it. */
export class QueueGroup {
  code: string;
  label: string;
  floorValue: number;
  channel: string;
  budget: number;
  status: QueueGroupStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    channel: string,
    budget: number,
    status: QueueGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.channel = channel;
    this.budget = budget;
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

  canMoveTo(next: QueueGroupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: QueueGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"queue group"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.floorValue * this.budget * 100) / 100;
  }

  copy(): QueueGroup {
    return new QueueGroup(this.code, this.label, this.floorValue, this.channel, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a queue group in status created. */
export function newQueueGroup(code: string, label: string): QueueGroup {
  return new QueueGroup(code, label, 0, "", 0, "created");
}
