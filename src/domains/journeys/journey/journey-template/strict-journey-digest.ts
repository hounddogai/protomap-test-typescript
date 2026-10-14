import * as text from "../../../../kit/text.js";

/** Where a strict journey digest is in its life cycle. */
export type StrictJourneyDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict journey digest and its current status. */
export class StrictJourneyDigest {
  code: string;
  label: string;
  expiresAt: number;
  bid: number;
  cohort: string;
  externalRef: string;
  ownerId: string;
  approved: boolean;
  archived: boolean;
  durationMinutes: number;
  status: StrictJourneyDigestStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    bid: number,
    cohort: string,
    externalRef: string,
    ownerId: string,
    approved: boolean,
    archived: boolean,
    durationMinutes: number,
    status: StrictJourneyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.ownerId = ownerId;
    this.approved = approved;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictJourneyDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictJourneyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict journey digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict journey digest"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes - this.expiresAt) * 100) / 100;
  }

  copy(): StrictJourneyDigest {
    return new StrictJourneyDigest(
      this.code,
      this.label,
      this.expiresAt,
      this.bid,
      this.cohort,
      this.externalRef,
      this.ownerId,
      this.approved,
      this.archived,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict journey digest in status proposed. */
export function newStrictJourneyDigest(code: string, label: string): StrictJourneyDigest {
  return new StrictJourneyDigest(code, label, 0, 0, "", "", "", false, false, 0, "proposed");
}
