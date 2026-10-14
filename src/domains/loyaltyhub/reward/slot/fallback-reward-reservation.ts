import * as text from "../../../../kit/text.js";

/** Where a fallback reward reservation is in its life cycle. */
export type FallbackRewardReservationStatus = "created" | "validated" | "published" | "retired";

/** A fallback reward reservation as the reward team keeps it. */
export class FallbackRewardReservation {
  code: string;
  title: string;
  graceDays: number;
  expiresAt: number;
  externalRef: string;
  status: FallbackRewardReservationStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    expiresAt: number,
    externalRef: string,
    status: FallbackRewardReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.externalRef = externalRef;
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

  canMoveTo(next: FallbackRewardReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackRewardReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback reward reservation"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.expiresAt * this.graceDays * 100) / 100;
  }

  copy(): FallbackRewardReservation {
    return new FallbackRewardReservation(
      this.code,
      this.title,
      this.graceDays,
      this.expiresAt,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback reward reservation in status created. */
export function newFallbackRewardReservation(code: string, title: string): FallbackRewardReservation {
  return new FallbackRewardReservation(code, title, 0, 0, "", "created");
}
