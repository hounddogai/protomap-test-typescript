import * as text from "../../../../kit/text.js";

/** Where a default model reservation is in its life cycle. */
export type DefaultModelReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A default model reservation as the model team keeps it. */
export class DefaultModelReservation {
  code: string;
  title: string;
  externalRef: string;
  timezone: string;
  endsAt: number;
  expiresAt: number;
  status: DefaultModelReservationStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    timezone: string,
    endsAt: number,
    expiresAt: number,
    status: DefaultModelReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultModelReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultModelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default model reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default model reservation"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.expiresAt * this.endsAt * 100) / 100;
  }

  copy(): DefaultModelReservation {
    return new DefaultModelReservation(
      this.code,
      this.title,
      this.externalRef,
      this.timezone,
      this.endsAt,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default model reservation in status requested. */
export function newDefaultModelReservation(code: string, title: string): DefaultModelReservation {
  return new DefaultModelReservation(code, title, "", "", 0, 0, "requested");
}
