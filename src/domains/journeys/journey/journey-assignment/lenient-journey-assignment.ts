/**
 * The lenient journey assignment records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient journey assignment is in its life cycle. */
export type LenientJourneyAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient journey assignment and its current status. */
export class LenientJourneyAssignment {
  code: string;
  label: string;
  graceDays: number;
  timezone: string;
  frequencyCap: number;
  description: string;
  budget: number;
  sendAt: number;
  active: boolean;
  status: LenientJourneyAssignmentStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    timezone: string,
    frequencyCap: number,
    description: string,
    budget: number,
    sendAt: number,
    active: boolean,
    status: LenientJourneyAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.description = description;
    this.budget = budget;
    this.sendAt = sendAt;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientJourneyAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientJourneyAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient journey assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.frequencyCap * this.graceDays * 100) / 100;
  }

  copy(): LenientJourneyAssignment {
    return new LenientJourneyAssignment(
      this.code,
      this.label,
      this.graceDays,
      this.timezone,
      this.frequencyCap,
      this.description,
      this.budget,
      this.sendAt,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient journey assignment in status idle. */
export function newLenientJourneyAssignment(code: string, label: string): LenientJourneyAssignment {
  return new LenientJourneyAssignment(code, label, 0, "", 0, "", 0, 0, false, "idle");
}
