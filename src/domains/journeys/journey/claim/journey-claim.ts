/**
 * The journey claim records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey claim is in its life cycle. */
export type JourneyClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey claim as the journey team keeps it. */
export class JourneyClaim {
  code: string;
  label: string;
  notes: string;
  reviewer: string;
  pinned: boolean;
  quantity: number;
  status: JourneyClaimStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    reviewer: string,
    pinned: boolean,
    quantity: number,
    status: JourneyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.reviewer = reviewer;
    this.pinned = pinned;
    this.quantity = quantity;
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

  canMoveTo(next: JourneyClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: JourneyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): JourneyClaim {
    return new JourneyClaim(this.code, this.label, this.notes, this.reviewer, this.pinned, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey claim in status proposed. */
export function newJourneyClaim(code: string, label: string): JourneyClaim {
  return new JourneyClaim(code, label, "", "", false, 0, "proposed");
}
