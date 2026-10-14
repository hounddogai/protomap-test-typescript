import * as text from "../../../../kit/text.js";

/** Where a scheduled payout reservation is in its life cycle. */
export type ScheduledPayoutReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled payout reservation, with what the planners need to act on it. */
export class ScheduledPayoutReservation {
  code: string;
  label: string;
  externalRef: string;
  channel: string;
  journeyId: string;
  score: number;
  status: ScheduledPayoutReservationStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    channel: string,
    journeyId: string,
    score: number,
    status: ScheduledPayoutReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.channel = channel;
    this.journeyId = journeyId;
    this.score = score;
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

  canMoveTo(next: ScheduledPayoutReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
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

  moveTo(next: ScheduledPayoutReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled payout reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled payout reservation"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledPayoutReservation {
    return new ScheduledPayoutReservation(
      this.code,
      this.label,
      this.externalRef,
      this.channel,
      this.journeyId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled payout reservation in status open. */
export function newScheduledPayoutReservation(code: string, label: string): ScheduledPayoutReservation {
  return new ScheduledPayoutReservation(code, label, "", "", "", 0, "open");
}
