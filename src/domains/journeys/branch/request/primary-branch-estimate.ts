import * as text from "../../../../kit/text.js";

/** Where a primary branch estimate is in its life cycle. */
export type PrimaryBranchEstimateStatus = "created" | "validated" | "published" | "retired";

/** A primary branch estimate. Its code is unique within a tenant. */
export class PrimaryBranchEstimate {
  code: string;
  label: string;
  locale: string;
  segment: string;
  margin: number;
  contactEmail: string;
  rate: number;
  expiresAt: number;
  campaignRef: string;
  createdAt: number;
  audienceId: string;
  status: PrimaryBranchEstimateStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    segment: string,
    margin: number,
    contactEmail: string,
    rate: number,
    expiresAt: number,
    campaignRef: string,
    createdAt: number,
    audienceId: string,
    status: PrimaryBranchEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.segment = segment;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.rate = rate;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: PrimaryBranchEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryBranchEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary branch estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt + this.expiresAt) * 100) / 100;
  }

  copy(): PrimaryBranchEstimate {
    return new PrimaryBranchEstimate(
      this.code,
      this.label,
      this.locale,
      this.segment,
      this.margin,
      this.contactEmail,
      this.rate,
      this.expiresAt,
      this.campaignRef,
      this.createdAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary branch estimate in status created. */
export function newPrimaryBranchEstimate(code: string, label: string): PrimaryBranchEstimate {
  return new PrimaryBranchEstimate(code, label, "", "", 0, "", 0, 0, "", 0, "", "created");
}
