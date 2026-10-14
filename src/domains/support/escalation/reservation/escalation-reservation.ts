/**
 * The escalation reservation records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation reservation is in its life cycle. */
export type EscalationReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A escalation reservation. Its code is unique within a tenant. */
export class EscalationReservation {
  code: string;
  title: string;
  active: boolean;
  ratio: number;
  budget: number;
  approved: boolean;
  status: EscalationReservationStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    ratio: number,
    budget: number,
    approved: boolean,
    status: EscalationReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.ratio = ratio;
    this.budget = budget;
    this.approved = approved;
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

  canMoveTo(next: EscalationReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round((this.budget - this.ratio) * 100) / 100;
  }

  copy(): EscalationReservation {
    return new EscalationReservation(
      this.code,
      this.title,
      this.active,
      this.ratio,
      this.budget,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation reservation in status proposed. */
export function newEscalationReservation(code: string, title: string): EscalationReservation {
  return new EscalationReservation(code, title, false, 0, 0, false, "proposed");
}
