import * as text from "../../../../kit/text.js";

/** Where a challenge reservation is in its life cycle. */
export type ChallengeReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One challenge reservation, with what the planners need to act on it. */
export class ChallengeReservation {
  code: string;
  label: string;
  channel: string;
  title: string;
  rate: number;
  amount: number;
  durationMinutes: number;
  status: ChallengeReservationStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    title: string,
    rate: number,
    amount: number,
    durationMinutes: number,
    status: ChallengeReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.title = title;
    this.rate = rate;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ChallengeReservationStatus): boolean {
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

  moveTo(next: ChallengeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"challenge reservation"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.rate * this.durationMinutes * 100) / 100;
  }

  copy(): ChallengeReservation {
    return new ChallengeReservation(
      this.code,
      this.label,
      this.channel,
      this.title,
      this.rate,
      this.amount,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge reservation in status proposed. */
export function newChallengeReservation(code: string, label: string): ChallengeReservation {
  return new ChallengeReservation(code, label, "", "", 0, 0, 0, "proposed");
}
