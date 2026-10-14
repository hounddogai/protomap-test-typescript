import * as text from "../../../../kit/text.js";

/** Where a credit reservation is in its life cycle. */
export type CreditReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A credit reservation as the credit team keeps it. */
export class CreditReservation {
  code: string;
  title: string;
  externalRef: string;
  attempts: number;
  reviewer: string;
  startsAt: number;
  minimum: number;
  archived: boolean;
  batchSize: number;
  checksum: string;
  utmSource: string;
  status: CreditReservationStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    attempts: number,
    reviewer: string,
    startsAt: number,
    minimum: number,
    archived: boolean,
    batchSize: number,
    checksum: string,
    utmSource: string,
    status: CreditReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.archived = archived;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.utmSource = utmSource;
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

  canMoveTo(next: CreditReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreditReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"credit reservation"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.attempts + this.minimum) * 100) / 100;
  }

  copy(): CreditReservation {
    return new CreditReservation(
      this.code,
      this.title,
      this.externalRef,
      this.attempts,
      this.reviewer,
      this.startsAt,
      this.minimum,
      this.archived,
      this.batchSize,
      this.checksum,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a credit reservation in status requested. */
export function newCreditReservation(code: string, title: string): CreditReservation {
  return new CreditReservation(code, title, "", 0, "", 0, 0, false, 0, "", "", "requested");
}
