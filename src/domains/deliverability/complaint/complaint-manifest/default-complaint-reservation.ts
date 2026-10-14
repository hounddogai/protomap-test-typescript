import * as text from "../../../../kit/text.js";

/** Where a default complaint reservation is in its life cycle. */
export type DefaultComplaintReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One default complaint reservation, with what the planners need to act on it. */
export class DefaultComplaintReservation {
  code: string;
  title: string;
  revision: number;
  budget: number;
  openRate: number;
  discount: number;
  status: DefaultComplaintReservationStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    budget: number,
    openRate: number,
    discount: number,
    status: DefaultComplaintReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.budget = budget;
    this.openRate = openRate;
    this.discount = discount;
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

  canMoveTo(next: DefaultComplaintReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: DefaultComplaintReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default complaint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.revision * 100) / 100;
  }

  copy(): DefaultComplaintReservation {
    return new DefaultComplaintReservation(
      this.code,
      this.title,
      this.revision,
      this.budget,
      this.openRate,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default complaint reservation in status proposed. */
export function newDefaultComplaintReservation(code: string, title: string): DefaultComplaintReservation {
  return new DefaultComplaintReservation(code, title, 0, 0, 0, 0, "proposed");
}
