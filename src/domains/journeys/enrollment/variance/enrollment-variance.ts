/**
 * The enrollment variance records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment variance is in its life cycle. */
export type EnrollmentVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A enrollment variance. Its code is unique within a tenant. */
export class EnrollmentVariance {
  code: string;
  name: string;
  attempts: number;
  frequencyCap: number;
  sendAt: number;
  endsAt: number;
  unit: string;
  archived: boolean;
  channel: string;
  status: EnrollmentVarianceStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    frequencyCap: number,
    sendAt: number,
    endsAt: number,
    unit: string,
    archived: boolean,
    channel: string,
    status: EnrollmentVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.unit = unit;
    this.archived = archived;
    this.channel = channel;
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

  canMoveTo(next: EnrollmentVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: EnrollmentVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round((this.attempts - this.endsAt) * 100) / 100;
  }

  copy(): EnrollmentVariance {
    return new EnrollmentVariance(
      this.code,
      this.name,
      this.attempts,
      this.frequencyCap,
      this.sendAt,
      this.endsAt,
      this.unit,
      this.archived,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a enrollment variance in status requested. */
export function newEnrollmentVariance(code: string, name: string): EnrollmentVariance {
  return new EnrollmentVariance(code, name, 0, 0, 0, 0, "", false, "", "requested");
}
