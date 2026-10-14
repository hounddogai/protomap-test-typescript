import * as text from "../../../../kit/text.js";

/** Where a subscription allocation is in its life cycle. */
export type SubscriptionAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A subscription allocation as the subscription team keeps it. */
export class SubscriptionAllocation {
  code: string;
  title: string;
  active: boolean;
  locale: string;
  createdAt: number;
  status: SubscriptionAllocationStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    locale: string,
    createdAt: number,
    status: SubscriptionAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.locale = locale;
    this.createdAt = createdAt;
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

  canMoveTo(next: SubscriptionAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): SubscriptionAllocation {
    return new SubscriptionAllocation(this.code, this.title, this.active, this.locale, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription allocation in status idle. */
export function newSubscriptionAllocation(code: string, title: string): SubscriptionAllocation {
  return new SubscriptionAllocation(code, title, false, "", 0, "idle");
}
