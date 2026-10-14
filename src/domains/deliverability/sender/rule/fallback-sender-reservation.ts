import * as text from "../../../../kit/text.js";

/** Where a fallback sender reservation is in its life cycle. */
export type FallbackSenderReservationStatus = "created" | "validated" | "published" | "retired";

/** One fallback sender reservation, with what the planners need to act on it. */
export class FallbackSenderReservation {
  code: string;
  title: string;
  channel: string;
  currency: string;
  locale: string;
  createdAt: number;
  budget: number;
  status: FallbackSenderReservationStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    currency: string,
    locale: string,
    createdAt: number,
    budget: number,
    status: FallbackSenderReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.currency = currency;
    this.locale = locale;
    this.createdAt = createdAt;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSenderReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackSenderReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round(this.createdAt * this.budget * 100) / 100;
  }

  copy(): FallbackSenderReservation {
    return new FallbackSenderReservation(
      this.code,
      this.title,
      this.channel,
      this.currency,
      this.locale,
      this.createdAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback sender reservation in status created. */
export function newFallbackSenderReservation(code: string, title: string): FallbackSenderReservation {
  return new FallbackSenderReservation(code, title, "", "", "", 0, 0, "created");
}
