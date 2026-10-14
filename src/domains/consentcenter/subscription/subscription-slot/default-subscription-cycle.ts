import * as text from "../../../../kit/text.js";

/** Where a default subscription cycle is in its life cycle. */
export type DefaultSubscriptionCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One default subscription cycle, with what the planners need to act on it. */
export class DefaultSubscriptionCycle {
  code: string;
  label: string;
  locale: string;
  externalRef: string;
  capacity: number;
  tags: string[];
  variant: string;
  rate: number;
  windowDays: number;
  amount: number;
  status: DefaultSubscriptionCycleStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    externalRef: string,
    capacity: number,
    tags: string[],
    variant: string,
    rate: number,
    windowDays: number,
    amount: number,
    status: DefaultSubscriptionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.externalRef = externalRef;
    this.capacity = capacity;
    this.tags = tags;
    this.variant = variant;
    this.rate = rate;
    this.windowDays = windowDays;
    this.amount = amount;
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

  canMoveTo(next: DefaultSubscriptionCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultSubscriptionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default subscription cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round(this.windowDays * this.capacity * 100) / 100;
  }

  copy(): DefaultSubscriptionCycle {
    return new DefaultSubscriptionCycle(
      this.code,
      this.label,
      this.locale,
      this.externalRef,
      this.capacity,
      this.tags,
      this.variant,
      this.rate,
      this.windowDays,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default subscription cycle in status idle. */
export function newDefaultSubscriptionCycle(code: string, label: string): DefaultSubscriptionCycle {
  return new DefaultSubscriptionCycle(code, label, "", "", 0, [], "", 0, 0, 0, "idle");
}
