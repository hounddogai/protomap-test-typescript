import * as text from "../../../../kit/text.js";

/** Where a tiered enrollment agreement is in its life cycle. */
export type TieredEnrollmentAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered enrollment agreement. Its code is unique within a tenant. */
export class TieredEnrollmentAgreement {
  code: string;
  label: string;
  limit: number;
  description: string;
  currency: string;
  priority: number;
  createdAt: number;
  audienceId: string;
  expiresAt: number;
  unit: string;
  impressions: number;
  status: TieredEnrollmentAgreementStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    description: string,
    currency: string,
    priority: number,
    createdAt: number,
    audienceId: string,
    expiresAt: number,
    unit: string,
    impressions: number,
    status: TieredEnrollmentAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.description = description;
    this.currency = currency;
    this.priority = priority;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
    this.expiresAt = expiresAt;
    this.unit = unit;
    this.impressions = impressions;
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

  canMoveTo(next: TieredEnrollmentAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredEnrollmentAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered enrollment agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered enrollment agreement"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.createdAt - this.impressions) * 100) / 100;
  }

  copy(): TieredEnrollmentAgreement {
    return new TieredEnrollmentAgreement(
      this.code,
      this.label,
      this.limit,
      this.description,
      this.currency,
      this.priority,
      this.createdAt,
      this.audienceId,
      this.expiresAt,
      this.unit,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered enrollment agreement in status draft. */
export function newTieredEnrollmentAgreement(code: string, label: string): TieredEnrollmentAgreement {
  return new TieredEnrollmentAgreement(code, label, 0, "", "", 0, 0, "", 0, "", 0, "draft");
}
