import * as text from "../../../../kit/text.js";

/** Where a enrollment request is in its life cycle. */
export type EnrollmentRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** One enrollment request, with what the planners need to act on it. */
export class EnrollmentRequest {
  code: string;
  name: string;
  locale: string;
  expiresAt: number;
  bid: number;
  notes: string;
  capacity: number;
  sequence: number;
  status: EnrollmentRequestStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    expiresAt: number,
    bid: number,
    notes: string,
    capacity: number,
    sequence: number,
    status: EnrollmentRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.notes = notes;
    this.capacity = capacity;
    this.sequence = sequence;
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

  canMoveTo(next: EnrollmentRequestStatus): boolean {
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

  moveTo(next: EnrollmentRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"enrollment request"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt - this.sequence) * 100) / 100;
  }

  copy(): EnrollmentRequest {
    return new EnrollmentRequest(
      this.code,
      this.name,
      this.locale,
      this.expiresAt,
      this.bid,
      this.notes,
      this.capacity,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment request in status requested. */
export function newEnrollmentRequest(code: string, name: string): EnrollmentRequest {
  return new EnrollmentRequest(code, name, "", 0, 0, "", 0, 0, "requested");
}
