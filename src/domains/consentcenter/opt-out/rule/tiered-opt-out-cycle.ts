import * as text from "../../../../kit/text.js";

/** Where a tiered opt out cycle is in its life cycle. */
export type TieredOptOutCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered opt out cycle, with what the planners need to act on it. */
export class TieredOptOutCycle {
  code: string;
  label: string;
  ownerId: string;
  contactEmail: string;
  sendAt: number;
  quantity: number;
  status: TieredOptOutCycleStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    contactEmail: string,
    sendAt: number,
    quantity: number,
    status: TieredOptOutCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.contactEmail = contactEmail;
    this.sendAt = sendAt;
    this.quantity = quantity;
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

  canMoveTo(next: TieredOptOutCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredOptOutCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered opt out cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered opt out cycle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.sendAt + this.quantity) * 100) / 100;
  }

  copy(): TieredOptOutCycle {
    return new TieredOptOutCycle(
      this.code,
      this.label,
      this.ownerId,
      this.contactEmail,
      this.sendAt,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered opt out cycle in status idle. */
export function newTieredOptOutCycle(code: string, label: string): TieredOptOutCycle {
  return new TieredOptOutCycle(code, label, "", "", 0, 0, "idle");
}
