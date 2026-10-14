import * as text from "../../../../kit/text.js";

/** Where a sla allocation is in its life cycle. */
export type SlaAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a sla allocation and its current status. */
export class SlaAllocation {
  code: string;
  name: string;
  pinned: boolean;
  audienceId: string;
  attempts: number;
  priority: number;
  ceiling: number;
  bid: number;
  cost: number;
  windowDays: number;
  channel: string;
  status: SlaAllocationStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    audienceId: string,
    attempts: number,
    priority: number,
    ceiling: number,
    bid: number,
    cost: number,
    windowDays: number,
    channel: string,
    status: SlaAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.priority = priority;
    this.ceiling = ceiling;
    this.bid = bid;
    this.cost = cost;
    this.windowDays = windowDays;
    this.channel = channel;
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

  canMoveTo(next: SlaAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: SlaAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla allocation"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.bid - this.cost) * 100) / 100;
  }

  copy(): SlaAllocation {
    return new SlaAllocation(
      this.code,
      this.name,
      this.pinned,
      this.audienceId,
      this.attempts,
      this.priority,
      this.ceiling,
      this.bid,
      this.cost,
      this.windowDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sla allocation in status new. */
export function newSlaAllocation(code: string, name: string): SlaAllocation {
  return new SlaAllocation(code, name, false, "", 0, 0, 0, 0, 0, 0, "", "new");
}
