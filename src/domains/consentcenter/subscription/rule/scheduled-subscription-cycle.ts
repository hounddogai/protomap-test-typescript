import * as text from "../../../../kit/text.js";

/** Where a scheduled subscription cycle is in its life cycle. */
export type ScheduledSubscriptionCycleStatus = "created" | "validated" | "published" | "retired";

/** One scheduled subscription cycle, with what the planners need to act on it. */
export class ScheduledSubscriptionCycle {
  code: string;
  name: string;
  ownerId: string;
  quantity: number;
  variant: string;
  version: number;
  priority: number;
  status: ScheduledSubscriptionCycleStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    quantity: number,
    variant: string,
    version: number,
    priority: number,
    status: ScheduledSubscriptionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.variant = variant;
    this.version = version;
    this.priority = priority;
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

  canMoveTo(next: ScheduledSubscriptionCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSubscriptionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled subscription cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.version - this.priority) * 100) / 100;
  }

  copy(): ScheduledSubscriptionCycle {
    return new ScheduledSubscriptionCycle(
      this.code,
      this.name,
      this.ownerId,
      this.quantity,
      this.variant,
      this.version,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled subscription cycle in status created. */
export function newScheduledSubscriptionCycle(code: string, name: string): ScheduledSubscriptionCycle {
  return new ScheduledSubscriptionCycle(code, name, "", 0, "", 0, 0, "created");
}
