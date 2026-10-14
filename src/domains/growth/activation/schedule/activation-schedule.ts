/**
 * The activation schedule records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation schedule is in its life cycle. */
export type ActivationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A activation schedule. Its code is unique within a tenant. */
export class ActivationSchedule {
  code: string;
  label: string;
  budget: number;
  windowDays: number;
  endsAt: number;
  currency: string;
  status: ActivationScheduleStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    windowDays: number,
    endsAt: number,
    currency: string,
    status: ActivationScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.windowDays = windowDays;
    this.endsAt = endsAt;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ActivationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.endsAt + this.budget) * 100) / 100;
  }

  copy(): ActivationSchedule {
    return new ActivationSchedule(
      this.code,
      this.label,
      this.budget,
      this.windowDays,
      this.endsAt,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation schedule in status proposed. */
export function newActivationSchedule(code: string, label: string): ActivationSchedule {
  return new ActivationSchedule(code, label, 0, 0, 0, "", "proposed");
}
