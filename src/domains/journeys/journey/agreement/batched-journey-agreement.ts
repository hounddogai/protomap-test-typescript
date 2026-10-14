/**
 * The batched journey agreement records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched journey agreement is in its life cycle. */
export type BatchedJourneyAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a batched journey agreement and its current status. */
export class BatchedJourneyAgreement {
  code: string;
  name: string;
  country: string;
  attempts: number;
  timezone: string;
  archived: boolean;
  status: BatchedJourneyAgreementStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    attempts: number,
    timezone: string,
    archived: boolean,
    status: BatchedJourneyAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.attempts = attempts;
    this.timezone = timezone;
    this.archived = archived;
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

  canMoveTo(next: BatchedJourneyAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedJourneyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): BatchedJourneyAgreement {
    return new BatchedJourneyAgreement(
      this.code,
      this.name,
      this.country,
      this.attempts,
      this.timezone,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched journey agreement in status proposed. */
export function newBatchedJourneyAgreement(code: string, name: string): BatchedJourneyAgreement {
  return new BatchedJourneyAgreement(code, name, "", 0, "", false, "proposed");
}
