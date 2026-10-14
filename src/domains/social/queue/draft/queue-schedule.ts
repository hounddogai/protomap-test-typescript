import * as text from "../../../../kit/text.js";

/** Where a queue schedule is in its life cycle. */
export type QueueScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a queue schedule and its current status. */
export class QueueSchedule {
  code: string;
  title: string;
  attributes: Map<string, string>;
  budget: number;
  locale: string;
  currency: string;
  rate: number;
  status: QueueScheduleStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    budget: number,
    locale: string,
    currency: string,
    rate: number,
    status: QueueScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.budget = budget;
    this.locale = locale;
    this.currency = currency;
    this.rate = rate;
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

  canMoveTo(next: QueueScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: QueueScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.budget + this.rate) * 100) / 100;
  }

  copy(): QueueSchedule {
    return new QueueSchedule(
      this.code,
      this.title,
      this.attributes,
      this.budget,
      this.locale,
      this.currency,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue schedule in status planned. */
export function newQueueSchedule(code: string, title: string): QueueSchedule {
  return new QueueSchedule(code, title, new Map<string, string>(), 0, "", "", 0, "planned");
}
