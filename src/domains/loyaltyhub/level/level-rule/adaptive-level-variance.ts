import * as text from "../../../../kit/text.js";

/** Where a adaptive level variance is in its life cycle. */
export type AdaptiveLevelVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive level variance. Its code is unique within a tenant. */
export class AdaptiveLevelVariance {
  code: string;
  label: string;
  pinned: boolean;
  revision: number;
  contactEmail: string;
  approved: boolean;
  campaignRef: string;
  currency: string;
  status: AdaptiveLevelVarianceStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    revision: number,
    contactEmail: string,
    approved: boolean,
    campaignRef: string,
    currency: string,
    status: AdaptiveLevelVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: AdaptiveLevelVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
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

  moveTo(next: AdaptiveLevelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive level variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): AdaptiveLevelVariance {
    return new AdaptiveLevelVariance(
      this.code,
      this.label,
      this.pinned,
      this.revision,
      this.contactEmail,
      this.approved,
      this.campaignRef,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive level variance in status draft. */
export function newAdaptiveLevelVariance(code: string, label: string): AdaptiveLevelVariance {
  return new AdaptiveLevelVariance(code, label, false, 0, "", false, "", "", "draft");
}
