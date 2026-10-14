import * as text from "../../../../kit/text.js";

/** Where a ticket view plan is in its life cycle. */
export type TicketViewPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One ticket view plan, with what the planners need to act on it. */
export class TicketViewPlan {
  code: string;
  name: string;
  region: string;
  approved: boolean;
  batchSize: number;
  sendAt: number;
  active: boolean;
  conversionRate: number;
  status: TicketViewPlanStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    approved: boolean,
    batchSize: number,
    sendAt: number,
    active: boolean,
    conversionRate: number,
    status: TicketViewPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.approved = approved;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.active = active;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: TicketViewPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
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

  moveTo(next: TicketViewPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round(this.batchSize * this.conversionRate * 100) / 100;
  }

  copy(): TicketViewPlan {
    return new TicketViewPlan(
      this.code,
      this.name,
      this.region,
      this.approved,
      this.batchSize,
      this.sendAt,
      this.active,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a ticket view plan in status idle. */
export function newTicketViewPlan(code: string, name: string): TicketViewPlan {
  return new TicketViewPlan(code, name, "", false, 0, 0, false, 0, "idle");
}
