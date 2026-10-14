/**
 * The pending fraud check exception records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending fraud check exception is in its life cycle. */
export type PendingFraudCheckExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending fraud check exception. Its code is unique within a tenant. */
export class PendingFraudCheckException {
  code: string;
  label: string;
  budget: number;
  utmSource: string;
  audienceId: string;
  ownerId: string;
  bid: number;
  threshold: number;
  cohort: string;
  status: PendingFraudCheckExceptionStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    utmSource: string,
    audienceId: string,
    ownerId: string,
    bid: number,
    threshold: number,
    cohort: string,
    status: PendingFraudCheckExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.utmSource = utmSource;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
    this.bid = bid;
    this.threshold = threshold;
    this.cohort = cohort;
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

  canMoveTo(next: PendingFraudCheckExceptionStatus): boolean {
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingFraudCheckExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending fraud check exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget + this.bid) * 100) / 100;
  }

  copy(): PendingFraudCheckException {
    return new PendingFraudCheckException(
      this.code,
      this.label,
      this.budget,
      this.utmSource,
      this.audienceId,
      this.ownerId,
      this.bid,
      this.threshold,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending fraud check exception in status requested. */
export function newPendingFraudCheckException(code: string, label: string): PendingFraudCheckException {
  return new PendingFraudCheckException(code, label, 0, "", "", "", 0, 0, "", "requested");
}
