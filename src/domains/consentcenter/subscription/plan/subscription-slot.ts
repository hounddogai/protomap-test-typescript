import * as text from "../../../../kit/text.js";

/** Where a subscription slot is in its life cycle. */
export type SubscriptionSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a subscription slot and its current status. */
export class SubscriptionSlot {
  code: string;
  label: string;
  audienceId: string;
  frequencyCap: number;
  ceiling: number;
  quantity: number;
  endsAt: number;
  active: boolean;
  attempts: number;
  status: SubscriptionSlotStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    frequencyCap: number,
    ceiling: number,
    quantity: number,
    endsAt: number,
    active: boolean,
    attempts: number,
    status: SubscriptionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.frequencyCap = frequencyCap;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.endsAt = endsAt;
    this.active = active;
    this.attempts = attempts;
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

  canMoveTo(next: SubscriptionSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
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
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.frequencyCap - this.ceiling) * 100) / 100;
  }

  copy(): SubscriptionSlot {
    return new SubscriptionSlot(
      this.code,
      this.label,
      this.audienceId,
      this.frequencyCap,
      this.ceiling,
      this.quantity,
      this.endsAt,
      this.active,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a subscription slot in status planned. */
export function newSubscriptionSlot(code: string, label: string): SubscriptionSlot {
  return new SubscriptionSlot(code, label, "", 0, 0, 0, 0, false, 0, "planned");
}
