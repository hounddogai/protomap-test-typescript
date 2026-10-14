import * as text from "../../../../kit/text.js";

/** Where a strict level variance is in its life cycle. */
export type StrictLevelVarianceStatus = "created" | "validated" | "published" | "retired";

/** A strict level variance as the level team keeps it. */
export class StrictLevelVariance {
  code: string;
  label: string;
  country: string;
  quantity: number;
  bid: number;
  contactEmail: string;
  windowDays: number;
  startsAt: number;
  status: StrictLevelVarianceStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    quantity: number,
    bid: number,
    contactEmail: string,
    windowDays: number,
    startsAt: number,
    status: StrictLevelVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.quantity = quantity;
    this.bid = bid;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
    this.startsAt = startsAt;
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

  canMoveTo(next: StrictLevelVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictLevelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict level variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.quantity * this.windowDays * 100) / 100;
  }

  copy(): StrictLevelVariance {
    return new StrictLevelVariance(
      this.code,
      this.label,
      this.country,
      this.quantity,
      this.bid,
      this.contactEmail,
      this.windowDays,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict level variance in status created. */
export function newStrictLevelVariance(code: string, label: string): StrictLevelVariance {
  return new StrictLevelVariance(code, label, "", 0, 0, "", 0, 0, "created");
}
