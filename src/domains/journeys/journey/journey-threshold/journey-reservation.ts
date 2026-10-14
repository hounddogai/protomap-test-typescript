import * as text from "../../../../kit/text.js";

/** Where a journey reservation is in its life cycle. */
export type JourneyReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A journey reservation as the journey team keeps it. */
export class JourneyReservation {
  code: string;
  label: string;
  createdAt: number;
  visible: boolean;
  pinned: boolean;
  status: JourneyReservationStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    visible: boolean,
    pinned: boolean,
    status: JourneyReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.visible = visible;
    this.pinned = pinned;
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

  canMoveTo(next: JourneyReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: JourneyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): JourneyReservation {
    return new JourneyReservation(this.code, this.label, this.createdAt, this.visible, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey reservation in status open. */
export function newJourneyReservation(code: string, label: string): JourneyReservation {
  return new JourneyReservation(code, label, 0, false, false, "open");
}
