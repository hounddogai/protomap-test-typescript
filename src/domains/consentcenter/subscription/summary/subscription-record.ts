import * as text from "../../../../kit/text.js";

/** Where a subscription record is in its life cycle. */
export type SubscriptionRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A subscription record as the subscription team keeps it. */
export class SubscriptionRecord {
  code: string;
  label: string;
  active: boolean;
  minimum: number;
  sendAt: number;
  budget: number;
  attempts: number;
  limit: number;
  description: string;
  status: SubscriptionRecordStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    minimum: number,
    sendAt: number,
    budget: number,
    attempts: number,
    limit: number,
    description: string,
    status: SubscriptionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.minimum = minimum;
    this.sendAt = sendAt;
    this.budget = budget;
    this.attempts = attempts;
    this.limit = limit;
    this.description = description;
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

  canMoveTo(next: SubscriptionRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
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
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.attempts - this.minimum) * 100) / 100;
  }

  copy(): SubscriptionRecord {
    return new SubscriptionRecord(
      this.code,
      this.label,
      this.active,
      this.minimum,
      this.sendAt,
      this.budget,
      this.attempts,
      this.limit,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a subscription record in status planned. */
export function newSubscriptionRecord(code: string, label: string): SubscriptionRecord {
  return new SubscriptionRecord(code, label, false, 0, 0, 0, 0, 0, "", "planned");
}
