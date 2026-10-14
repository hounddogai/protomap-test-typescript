import * as text from "../../../../kit/text.js";

/** Where a rolling step claim is in its life cycle. */
export type RollingStepClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling step claim as the step team keeps it. */
export class RollingStepClaim {
  code: string;
  label: string;
  category: string;
  minimum: number;
  contactEmail: string;
  journeyId: string;
  status: RollingStepClaimStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    minimum: number,
    contactEmail: string,
    journeyId: string,
    status: RollingStepClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
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

  canMoveTo(next: RollingStepClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: RollingStepClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling step claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): RollingStepClaim {
    return new RollingStepClaim(
      this.code,
      this.label,
      this.category,
      this.minimum,
      this.contactEmail,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling step claim in status requested. */
export function newRollingStepClaim(code: string, label: string): RollingStepClaim {
  return new RollingStepClaim(code, label, "", 0, "", "", "requested");
}
