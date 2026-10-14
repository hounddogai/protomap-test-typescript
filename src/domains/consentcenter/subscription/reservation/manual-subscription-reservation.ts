import * as text from "../../../../kit/text.js";

/** Where a manual subscription reservation is in its life cycle. */
export type ManualSubscriptionReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One manual subscription reservation, with what the planners need to act on it. */
export class ManualSubscriptionReservation {
  code: string;
  title: string;
  contactEmail: string;
  priority: number;
  rate: number;
  capacity: number;
  ceiling: number;
  budget: number;
  revision: number;
  status: ManualSubscriptionReservationStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    priority: number,
    rate: number,
    capacity: number,
    ceiling: number,
    budget: number,
    revision: number,
    status: ManualSubscriptionReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.rate = rate;
    this.capacity = capacity;
    this.ceiling = ceiling;
    this.budget = budget;
    this.revision = revision;
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

  canMoveTo(next: ManualSubscriptionReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: ManualSubscriptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual subscription reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.rate * this.revision * 100) / 100;
  }

  copy(): ManualSubscriptionReservation {
    return new ManualSubscriptionReservation(
      this.code,
      this.title,
      this.contactEmail,
      this.priority,
      this.rate,
      this.capacity,
      this.ceiling,
      this.budget,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual subscription reservation in status planned. */
export function newManualSubscriptionReservation(code: string, title: string): ManualSubscriptionReservation {
  return new ManualSubscriptionReservation(code, title, "", 0, 0, 0, 0, 0, 0, "planned");
}
