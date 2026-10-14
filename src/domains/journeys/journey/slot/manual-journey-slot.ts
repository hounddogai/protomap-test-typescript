/**
 * The manual journey slot records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual journey slot is in its life cycle. */
export type ManualJourneySlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual journey slot and its current status. */
export class ManualJourneySlot {
  code: string;
  label: string;
  discount: number;
  externalRef: string;
  channel: string;
  retries: number;
  status: ManualJourneySlotStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    externalRef: string,
    channel: string,
    retries: number,
    status: ManualJourneySlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.externalRef = externalRef;
    this.channel = channel;
    this.retries = retries;
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

  canMoveTo(next: ManualJourneySlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: ManualJourneySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual journey slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.retries * this.discount * 100) / 100;
  }

  copy(): ManualJourneySlot {
    return new ManualJourneySlot(
      this.code,
      this.label,
      this.discount,
      this.externalRef,
      this.channel,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual journey slot in status planned. */
export function newManualJourneySlot(code: string, label: string): ManualJourneySlot {
  return new ManualJourneySlot(code, label, 0, "", "", 0, "planned");
}
