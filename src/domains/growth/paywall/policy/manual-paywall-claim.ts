import * as text from "../../../../kit/text.js";

/** Where a manual paywall claim is in its life cycle. */
export type ManualPaywallClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual paywall claim. Its code is unique within a tenant. */
export class ManualPaywallClaim {
  code: string;
  label: string;
  category: string;
  retries: number;
  clicks: number;
  variant: string;
  expiresAt: number;
  endsAt: number;
  cohort: string;
  maximum: number;
  utmSource: string;
  status: ManualPaywallClaimStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    retries: number,
    clicks: number,
    variant: string,
    expiresAt: number,
    endsAt: number,
    cohort: string,
    maximum: number,
    utmSource: string,
    status: ManualPaywallClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.retries = retries;
    this.clicks = clicks;
    this.variant = variant;
    this.expiresAt = expiresAt;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.maximum = maximum;
    this.utmSource = utmSource;
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

  canMoveTo(next: ManualPaywallClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPaywallClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual paywall claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual paywall claim"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): ManualPaywallClaim {
    return new ManualPaywallClaim(
      this.code,
      this.label,
      this.category,
      this.retries,
      this.clicks,
      this.variant,
      this.expiresAt,
      this.endsAt,
      this.cohort,
      this.maximum,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual paywall claim in status draft. */
export function newManualPaywallClaim(code: string, label: string): ManualPaywallClaim {
  return new ManualPaywallClaim(code, label, "", 0, 0, "", 0, 0, "", 0, "", "draft");
}
