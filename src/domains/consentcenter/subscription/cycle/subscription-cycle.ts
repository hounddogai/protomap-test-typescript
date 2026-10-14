/**
 * The subscription cycle records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription cycle is in its life cycle. */
export type SubscriptionCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One subscription cycle, with what the planners need to act on it. */
export class SubscriptionCycle {
  code: string;
  title: string;
  windowDays: number;
  ownerId: string;
  source: string;
  segment: string;
  endsAt: number;
  capacity: number;
  locale: string;
  status: SubscriptionCycleStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    ownerId: string,
    source: string,
    segment: string,
    endsAt: number,
    capacity: number,
    locale: string,
    status: SubscriptionCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.source = source;
    this.segment = segment;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"subscription cycle"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.capacity + this.windowDays) * 100) / 100;
  }

  copy(): SubscriptionCycle {
    return new SubscriptionCycle(
      this.code,
      this.title,
      this.windowDays,
      this.ownerId,
      this.source,
      this.segment,
      this.endsAt,
      this.capacity,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription cycle in status planned. */
export function newSubscriptionCycle(code: string, title: string): SubscriptionCycle {
  return new SubscriptionCycle(code, title, 0, "", "", "", 0, 0, "", "planned");
}
