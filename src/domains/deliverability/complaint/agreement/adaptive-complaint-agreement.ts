/**
 * The adaptive complaint agreement records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint agreement is in its life cycle. */
export type AdaptiveComplaintAgreementStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive complaint agreement and its current status. */
export class AdaptiveComplaintAgreement {
  code: string;
  label: string;
  margin: number;
  variant: string;
  weight: number;
  pinned: boolean;
  threshold: number;
  durationMinutes: number;
  conversionRate: number;
  name: string;
  openRate: number;
  status: AdaptiveComplaintAgreementStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    variant: string,
    weight: number,
    pinned: boolean,
    threshold: number,
    durationMinutes: number,
    conversionRate: number,
    name: string,
    openRate: number,
    status: AdaptiveComplaintAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.variant = variant;
    this.weight = weight;
    this.pinned = pinned;
    this.threshold = threshold;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.name = name;
    this.openRate = openRate;
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

  canMoveTo(next: AdaptiveComplaintAgreementStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
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

  moveTo(next: AdaptiveComplaintAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive complaint agreement"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.weight - this.durationMinutes) * 100) / 100;
  }

  copy(): AdaptiveComplaintAgreement {
    return new AdaptiveComplaintAgreement(
      this.code,
      this.label,
      this.margin,
      this.variant,
      this.weight,
      this.pinned,
      this.threshold,
      this.durationMinutes,
      this.conversionRate,
      this.name,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive complaint agreement in status requested. */
export function newAdaptiveComplaintAgreement(code: string, label: string): AdaptiveComplaintAgreement {
  return new AdaptiveComplaintAgreement(code, label, 0, "", 0, false, 0, 0, 0, "", 0, "requested");
}
