/**
 * The rolling pacing agreement records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling pacing agreement is in its life cycle. */
export type RollingPacingAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling pacing agreement as the pacing team keeps it. */
export class RollingPacingAgreement {
  code: string;
  label: string;
  campaignRef: string;
  unit: string;
  createdAt: number;
  variant: string;
  name: string;
  status: RollingPacingAgreementStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    unit: string,
    createdAt: number,
    variant: string,
    name: string,
    status: RollingPacingAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.createdAt = createdAt;
    this.variant = variant;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPacingAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingPacingAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RollingPacingAgreement {
    return new RollingPacingAgreement(
      this.code,
      this.label,
      this.campaignRef,
      this.unit,
      this.createdAt,
      this.variant,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling pacing agreement in status open. */
export function newRollingPacingAgreement(code: string, label: string): RollingPacingAgreement {
  return new RollingPacingAgreement(code, label, "", "", 0, "", "", "open");
}
