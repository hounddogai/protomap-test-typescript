/**
 * The subscription schedule records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription schedule is in its life cycle. */
export type SubscriptionScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a subscription schedule and its current status. */
export class SubscriptionSchedule {
  code: string;
  title: string;
  name: string;
  timezone: string;
  notes: string;
  description: string;
  source: string;
  variant: string;
  currency: string;
  frequencyCap: number;
  status: SubscriptionScheduleStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    timezone: string,
    notes: string,
    description: string,
    source: string,
    variant: string,
    currency: string,
    frequencyCap: number,
    status: SubscriptionScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.timezone = timezone;
    this.notes = notes;
    this.description = description;
    this.source = source;
    this.variant = variant;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: SubscriptionScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): SubscriptionSchedule {
    return new SubscriptionSchedule(
      this.code,
      this.title,
      this.name,
      this.timezone,
      this.notes,
      this.description,
      this.source,
      this.variant,
      this.currency,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription schedule in status planned. */
export function newSubscriptionSchedule(code: string, title: string): SubscriptionSchedule {
  return new SubscriptionSchedule(code, title, "", "", "", "", "", "", "", 0, "planned");
}
