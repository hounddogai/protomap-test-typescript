import * as text from "../../../../kit/text.js";

/** Where a primary double opt in quota is in its life cycle. */
export type PrimaryDoubleOptInQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary double opt in quota as the double opt in team keeps it. */
export class PrimaryDoubleOptInQuota {
  code: string;
  label: string;
  score: number;
  openRate: number;
  updatedAt: number;
  journeyId: string;
  status: PrimaryDoubleOptInQuotaStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    openRate: number,
    updatedAt: number,
    journeyId: string,
    status: PrimaryDoubleOptInQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PrimaryDoubleOptInQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryDoubleOptInQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary double opt in quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary double opt in quota"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.score * this.updatedAt * 100) / 100;
  }

  copy(): PrimaryDoubleOptInQuota {
    return new PrimaryDoubleOptInQuota(
      this.code,
      this.label,
      this.score,
      this.openRate,
      this.updatedAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary double opt in quota in status requested. */
export function newPrimaryDoubleOptInQuota(code: string, label: string): PrimaryDoubleOptInQuota {
  return new PrimaryDoubleOptInQuota(code, label, 0, 0, 0, "", "requested");
}
