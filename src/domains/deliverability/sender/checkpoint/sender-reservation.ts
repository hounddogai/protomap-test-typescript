import * as text from "../../../../kit/text.js";

/** Where a sender reservation is in its life cycle. */
export type SenderReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One sender reservation, with what the planners need to act on it. */
export class SenderReservation {
  code: string;
  label: string;
  quantity: number;
  country: string;
  archived: boolean;
  externalRef: string;
  priority: number;
  status: SenderReservationStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    country: string,
    archived: boolean,
    externalRef: string,
    priority: number,
    status: SenderReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.country = country;
    this.archived = archived;
    this.externalRef = externalRef;
    this.priority = priority;
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

  canMoveTo(next: SenderReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SenderReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"sender reservation"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.priority + this.quantity) * 100) / 100;
  }

  copy(): SenderReservation {
    return new SenderReservation(
      this.code,
      this.label,
      this.quantity,
      this.country,
      this.archived,
      this.externalRef,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sender reservation in status proposed. */
export function newSenderReservation(code: string, label: string): SenderReservation {
  return new SenderReservation(code, label, 0, "", false, "", 0, "proposed");
}
