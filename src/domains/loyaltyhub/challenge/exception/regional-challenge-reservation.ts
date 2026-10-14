import * as text from "../../../../kit/text.js";

/** Where a regional challenge reservation is in its life cycle. */
export type RegionalChallengeReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One regional challenge reservation, with what the planners need to act on it. */
export class RegionalChallengeReservation {
  code: string;
  title: string;
  threshold: number;
  windowDays: number;
  retries: number;
  startsAt: number;
  revision: number;
  summary: string;
  quantity: number;
  ratio: number;
  sendAt: number;
  status: RegionalChallengeReservationStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    windowDays: number,
    retries: number,
    startsAt: number,
    revision: number,
    summary: string,
    quantity: number,
    ratio: number,
    sendAt: number,
    status: RegionalChallengeReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.retries = retries;
    this.startsAt = startsAt;
    this.revision = revision;
    this.summary = summary;
    this.quantity = quantity;
    this.ratio = ratio;
    this.sendAt = sendAt;
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

  canMoveTo(next: RegionalChallengeReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalChallengeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional challenge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round(this.revision * this.threshold * 100) / 100;
  }

  copy(): RegionalChallengeReservation {
    return new RegionalChallengeReservation(
      this.code,
      this.title,
      this.threshold,
      this.windowDays,
      this.retries,
      this.startsAt,
      this.revision,
      this.summary,
      this.quantity,
      this.ratio,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional challenge reservation in status new. */
export function newRegionalChallengeReservation(code: string, title: string): RegionalChallengeReservation {
  return new RegionalChallengeReservation(code, title, 0, 0, 0, 0, 0, "", 0, 0, 0, "new");
}
