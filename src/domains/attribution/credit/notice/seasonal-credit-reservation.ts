import * as text from "../../../../kit/text.js";

/** Where a seasonal credit reservation is in its life cycle. */
export type SeasonalCreditReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal credit reservation. Its code is unique within a tenant. */
export class SeasonalCreditReservation {
  code: string;
  label: string;
  ratio: number;
  phone: string;
  margin: number;
  channel: string;
  status: SeasonalCreditReservationStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    phone: string,
    margin: number,
    channel: string,
    status: SeasonalCreditReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.phone = phone;
    this.margin = margin;
    this.channel = channel;
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

  canMoveTo(next: SeasonalCreditReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: SeasonalCreditReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal credit reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal credit reservation"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.ratio - this.margin) * 100) / 100;
  }

  copy(): SeasonalCreditReservation {
    return new SeasonalCreditReservation(
      this.code,
      this.label,
      this.ratio,
      this.phone,
      this.margin,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal credit reservation in status open. */
export function newSeasonalCreditReservation(code: string, label: string): SeasonalCreditReservation {
  return new SeasonalCreditReservation(code, label, 0, "", 0, "", "open");
}
