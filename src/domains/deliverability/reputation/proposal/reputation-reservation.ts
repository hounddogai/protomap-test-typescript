import * as text from "../../../../kit/text.js";

/** Where a reputation reservation is in its life cycle. */
export type ReputationReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One reputation reservation, with what the planners need to act on it. */
export class ReputationReservation {
  code: string;
  label: string;
  limit: number;
  retries: number;
  pinned: boolean;
  margin: number;
  name: string;
  maximum: number;
  attempts: number;
  endsAt: number;
  status: ReputationReservationStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    retries: number,
    pinned: boolean,
    margin: number,
    name: string,
    maximum: number,
    attempts: number,
    endsAt: number,
    status: ReputationReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.retries = retries;
    this.pinned = pinned;
    this.margin = margin;
    this.name = name;
    this.maximum = maximum;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reputation reservation"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt + this.maximum) * 100) / 100;
  }

  copy(): ReputationReservation {
    return new ReputationReservation(
      this.code,
      this.label,
      this.limit,
      this.retries,
      this.pinned,
      this.margin,
      this.name,
      this.maximum,
      this.attempts,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation reservation in status new. */
export function newReputationReservation(code: string, label: string): ReputationReservation {
  return new ReputationReservation(code, label, 0, 0, false, 0, "", 0, 0, 0, "new");
}
