import * as text from "../../../../kit/text.js";

/** Where a weighted proof agreement is in its life cycle. */
export type WeightedProofAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted proof agreement and its current status. */
export class WeightedProofAgreement {
  code: string;
  label: string;
  capacity: number;
  unit: string;
  cost: number;
  campaignRef: string;
  contactEmail: string;
  priority: number;
  approved: boolean;
  graceDays: number;
  status: WeightedProofAgreementStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    unit: string,
    cost: number,
    campaignRef: string,
    contactEmail: string,
    priority: number,
    approved: boolean,
    graceDays: number,
    status: WeightedProofAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.unit = unit;
    this.cost = cost;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.approved = approved;
    this.graceDays = graceDays;
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

  canMoveTo(next: WeightedProofAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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

  moveTo(next: WeightedProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.cost * this.capacity * 100) / 100;
  }

  copy(): WeightedProofAgreement {
    return new WeightedProofAgreement(
      this.code,
      this.label,
      this.capacity,
      this.unit,
      this.cost,
      this.campaignRef,
      this.contactEmail,
      this.priority,
      this.approved,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted proof agreement in status proposed. */
export function newWeightedProofAgreement(code: string, label: string): WeightedProofAgreement {
  return new WeightedProofAgreement(code, label, 0, "", 0, "", "", 0, false, 0, "proposed");
}
