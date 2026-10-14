import * as text from "../../../../kit/text.js";

/** Where a capped bounce record is in its life cycle. */
export type CappedBounceRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped bounce record. Its code is unique within a tenant. */
export class CappedBounceRecord {
  code: string;
  title: string;
  cost: number;
  channel: string;
  budget: number;
  status: CappedBounceRecordStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    channel: string,
    budget: number,
    status: CappedBounceRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.channel = channel;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedBounceRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedBounceRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bounce record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.cost - this.budget) * 100) / 100;
  }

  copy(): CappedBounceRecord {
    return new CappedBounceRecord(this.code, this.title, this.cost, this.channel, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped bounce record in status idle. */
export function newCappedBounceRecord(code: string, title: string): CappedBounceRecord {
  return new CappedBounceRecord(code, title, 0, "", 0, "idle");
}
