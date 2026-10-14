import * as text from "../../../../kit/text.js";

/** Where a manual credit plan is in its life cycle. */
export type ManualCreditPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual credit plan. Its code is unique within a tenant. */
export class ManualCreditPlan {
  code: string;
  label: string;
  unit: string;
  description: string;
  variant: string;
  contactEmail: string;
  threshold: number;
  weight: number;
  status: ManualCreditPlanStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    description: string,
    variant: string,
    contactEmail: string,
    threshold: number,
    weight: number,
    status: ManualCreditPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.description = description;
    this.variant = variant;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.weight = weight;
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

  canMoveTo(next: ManualCreditPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualCreditPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual credit plan"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.threshold - this.weight) * 100) / 100;
  }

  copy(): ManualCreditPlan {
    return new ManualCreditPlan(
      this.code,
      this.label,
      this.unit,
      this.description,
      this.variant,
      this.contactEmail,
      this.threshold,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual credit plan in status requested. */
export function newManualCreditPlan(code: string, label: string): ManualCreditPlan {
  return new ManualCreditPlan(code, label, "", "", "", "", 0, 0, "requested");
}
