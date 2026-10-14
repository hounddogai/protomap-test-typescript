import * as text from "../../../../kit/text.js";

/** Where a deflection reservation is in its life cycle. */
export type DeflectionReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A deflection reservation as the deflection team keeps it. */
export class DeflectionReservation {
  code: string;
  label: string;
  name: string;
  attempts: number;
  visible: boolean;
  approved: boolean;
  ratio: number;
  status: DeflectionReservationStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    attempts: number,
    visible: boolean,
    approved: boolean,
    ratio: number,
    status: DeflectionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.attempts = attempts;
    this.visible = visible;
    this.approved = approved;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"deflection reservation"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.attempts * this.ratio * 100) / 100;
  }

  copy(): DeflectionReservation {
    return new DeflectionReservation(
      this.code,
      this.label,
      this.name,
      this.attempts,
      this.visible,
      this.approved,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection reservation in status open. */
export function newDeflectionReservation(code: string, label: string): DeflectionReservation {
  return new DeflectionReservation(code, label, "", 0, false, false, 0, "open");
}
