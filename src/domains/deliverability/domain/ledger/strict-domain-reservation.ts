import * as text from "../../../../kit/text.js";

/** Where a strict domain reservation is in its life cycle. */
export type StrictDomainReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict domain reservation as the domain team keeps it. */
export class StrictDomainReservation {
  code: string;
  name: string;
  quantity: number;
  label: string;
  batchSize: number;
  score: number;
  locale: string;
  weight: number;
  campaignRef: string;
  status: StrictDomainReservationStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    label: string,
    batchSize: number,
    score: number,
    locale: string,
    weight: number,
    campaignRef: string,
    status: StrictDomainReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.label = label;
    this.batchSize = batchSize;
    this.score = score;
    this.locale = locale;
    this.weight = weight;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: StrictDomainReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictDomainReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict domain reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round(this.score * this.batchSize * 100) / 100;
  }

  copy(): StrictDomainReservation {
    return new StrictDomainReservation(
      this.code,
      this.name,
      this.quantity,
      this.label,
      this.batchSize,
      this.score,
      this.locale,
      this.weight,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict domain reservation in status requested. */
export function newStrictDomainReservation(code: string, name: string): StrictDomainReservation {
  return new StrictDomainReservation(code, name, 0, "", 0, 0, "", 0, "", "requested");
}
