/**
 * The enrollment agreement records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment agreement is in its life cycle. */
export type EnrollmentAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a enrollment agreement and its current status. */
export class EnrollmentAgreement {
  code: string;
  name: string;
  contactEmail: string;
  journeyId: string;
  visible: boolean;
  weight: number;
  utmSource: string;
  margin: number;
  discount: number;
  status: EnrollmentAgreementStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    journeyId: string,
    visible: boolean,
    weight: number,
    utmSource: string,
    margin: number,
    discount: number,
    status: EnrollmentAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.visible = visible;
    this.weight = weight;
    this.utmSource = utmSource;
    this.margin = margin;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EnrollmentAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.discount - this.weight) * 100) / 100;
  }

  copy(): EnrollmentAgreement {
    return new EnrollmentAgreement(
      this.code,
      this.name,
      this.contactEmail,
      this.journeyId,
      this.visible,
      this.weight,
      this.utmSource,
      this.margin,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a enrollment agreement in status idle. */
export function newEnrollmentAgreement(code: string, name: string): EnrollmentAgreement {
  return new EnrollmentAgreement(code, name, "", "", false, 0, "", 0, 0, "idle");
}
