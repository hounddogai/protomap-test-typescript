import * as text from "../../../../kit/text.js";

/** Where a placement agreement is in its life cycle. */
export type PlacementAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A placement agreement as the placement team keeps it. */
export class PlacementAgreement {
  code: string;
  label: string;
  retries: number;
  revision: number;
  frequencyCap: number;
  contactEmail: string;
  currency: string;
  status: PlacementAgreementStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    revision: number,
    frequencyCap: number,
    contactEmail: string,
    currency: string,
    status: PlacementAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"placement agreement"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.retries + this.frequencyCap) * 100) / 100;
  }

  copy(): PlacementAgreement {
    return new PlacementAgreement(
      this.code,
      this.label,
      this.retries,
      this.revision,
      this.frequencyCap,
      this.contactEmail,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement agreement in status draft. */
export function newPlacementAgreement(code: string, label: string): PlacementAgreement {
  return new PlacementAgreement(code, label, 0, 0, 0, "", "", "draft");
}
