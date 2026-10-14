import * as text from "../../../../kit/text.js";

/** Where a scheduled invite allocation is in its life cycle. */
export type ScheduledInviteAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled invite allocation as the invite team keeps it. */
export class ScheduledInviteAllocation {
  code: string;
  title: string;
  name: string;
  amount: number;
  sendAt: number;
  label: string;
  status: ScheduledInviteAllocationStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    amount: number,
    sendAt: number,
    label: string,
    status: ScheduledInviteAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.amount = amount;
    this.sendAt = sendAt;
    this.label = label;
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

  canMoveTo(next: ScheduledInviteAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "stopped";
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

  moveTo(next: ScheduledInviteAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled invite allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled invite allocation"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.sendAt * this.amount * 100) / 100;
  }

  copy(): ScheduledInviteAllocation {
    return new ScheduledInviteAllocation(
      this.code,
      this.title,
      this.name,
      this.amount,
      this.sendAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled invite allocation in status idle. */
export function newScheduledInviteAllocation(code: string, title: string): ScheduledInviteAllocation {
  return new ScheduledInviteAllocation(code, title, "", 0, 0, "", "idle");
}
