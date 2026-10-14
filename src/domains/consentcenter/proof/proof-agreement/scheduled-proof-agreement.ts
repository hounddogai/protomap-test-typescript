/**
 * The scheduled proof agreement records of consentcenter's proof work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled proof agreement is in its life cycle. */
export type ScheduledProofAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled proof agreement and its current status. */
export class ScheduledProofAgreement {
  code: string;
  label: string;
  notes: string;
  floorValue: number;
  openRate: number;
  checksum: string;
  status: ScheduledProofAgreementStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    floorValue: number,
    openRate: number,
    checksum: string,
    status: ScheduledProofAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.floorValue = floorValue;
    this.openRate = openRate;
    this.checksum = checksum;
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

  canMoveTo(next: ScheduledProofAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: ScheduledProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round(this.floorValue * this.openRate * 100) / 100;
  }

  copy(): ScheduledProofAgreement {
    return new ScheduledProofAgreement(
      this.code,
      this.label,
      this.notes,
      this.floorValue,
      this.openRate,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled proof agreement in status created. */
export function newScheduledProofAgreement(code: string, label: string): ScheduledProofAgreement {
  return new ScheduledProofAgreement(code, label, "", 0, 0, "", "created");
}
