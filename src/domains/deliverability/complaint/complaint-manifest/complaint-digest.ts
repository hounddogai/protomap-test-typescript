import * as text from "../../../../kit/text.js";

/** Where a complaint digest is in its life cycle. */
export type ComplaintDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A complaint digest. Its code is unique within a tenant. */
export class ComplaintDigest {
  code: string;
  title: string;
  segment: string;
  graceDays: number;
  rate: number;
  journeyId: string;
  capacity: number;
  timezone: string;
  active: boolean;
  unit: string;
  contactEmail: string;
  status: ComplaintDigestStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    graceDays: number,
    rate: number,
    journeyId: string,
    capacity: number,
    timezone: string,
    active: boolean,
    unit: string,
    contactEmail: string,
    status: ComplaintDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.graceDays = graceDays;
    this.rate = rate;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.timezone = timezone;
    this.active = active;
    this.unit = unit;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ComplaintDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: ComplaintDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint digest"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.graceDays * this.rate * 100) / 100;
  }

  copy(): ComplaintDigest {
    return new ComplaintDigest(
      this.code,
      this.title,
      this.segment,
      this.graceDays,
      this.rate,
      this.journeyId,
      this.capacity,
      this.timezone,
      this.active,
      this.unit,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a complaint digest in status requested. */
export function newComplaintDigest(code: string, title: string): ComplaintDigest {
  return new ComplaintDigest(code, title, "", 0, 0, "", 0, "", false, "", "", "requested");
}
