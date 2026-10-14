import * as text from "../../../../kit/text.js";

/** Where a pending escalation slot is in its life cycle. */
export type PendingEscalationSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending escalation slot, with what the planners need to act on it. */
export class PendingEscalationSlot {
  code: string;
  title: string;
  ownerId: string;
  openRate: number;
  channel: string;
  cost: number;
  status: PendingEscalationSlotStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    openRate: number,
    channel: string,
    cost: number,
    status: PendingEscalationSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.openRate = openRate;
    this.channel = channel;
    this.cost = cost;
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

  canMoveTo(next: PendingEscalationSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingEscalationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending escalation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.openRate - this.cost) * 100) / 100;
  }

  copy(): PendingEscalationSlot {
    return new PendingEscalationSlot(
      this.code,
      this.title,
      this.ownerId,
      this.openRate,
      this.channel,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending escalation slot in status idle. */
export function newPendingEscalationSlot(code: string, title: string): PendingEscalationSlot {
  return new PendingEscalationSlot(code, title, "", 0, "", 0, "idle");
}
