import * as text from "../../../../kit/text.js";

/** Where a pending warmup reservation is in its life cycle. */
export type PendingWarmupReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending warmup reservation as the warmup team keeps it. */
export class PendingWarmupReservation {
  code: string;
  title: string;
  currency: string;
  country: string;
  limit: number;
  openRate: number;
  status: PendingWarmupReservationStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    country: string,
    limit: number,
    openRate: number,
    status: PendingWarmupReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.country = country;
    this.limit = limit;
    this.openRate = openRate;
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

  canMoveTo(next: PendingWarmupReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingWarmupReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending warmup reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round(this.openRate * this.limit * 100) / 100;
  }

  copy(): PendingWarmupReservation {
    return new PendingWarmupReservation(
      this.code,
      this.title,
      this.currency,
      this.country,
      this.limit,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending warmup reservation in status requested. */
export function newPendingWarmupReservation(code: string, title: string): PendingWarmupReservation {
  return new PendingWarmupReservation(code, title, "", "", 0, 0, "requested");
}
