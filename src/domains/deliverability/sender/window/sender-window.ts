/**
 * The sender window records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender window is in its life cycle. */
export type SenderWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sender window as the sender team keeps it. */
export class SenderWindow {
  code: string;
  title: string;
  category: string;
  conversionRate: number;
  minimum: number;
  cost: number;
  durationMinutes: number;
  journeyId: string;
  openRate: number;
  floorValue: number;
  status: SenderWindowStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    conversionRate: number,
    minimum: number,
    cost: number,
    durationMinutes: number,
    journeyId: string,
    openRate: number,
    floorValue: number,
    status: SenderWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.floorValue = floorValue;
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

  canMoveTo(next: SenderWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.durationMinutes - this.conversionRate) * 100) / 100;
  }

  copy(): SenderWindow {
    return new SenderWindow(
      this.code,
      this.title,
      this.category,
      this.conversionRate,
      this.minimum,
      this.cost,
      this.durationMinutes,
      this.journeyId,
      this.openRate,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a sender window in status proposed. */
export function newSenderWindow(code: string, title: string): SenderWindow {
  return new SenderWindow(code, title, "", 0, 0, 0, 0, "", 0, 0, "proposed");
}
