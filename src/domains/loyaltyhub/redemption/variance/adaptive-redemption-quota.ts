import * as text from "../../../../kit/text.js";

/** Where a adaptive redemption quota is in its life cycle. */
export type AdaptiveRedemptionQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive redemption quota and its current status. */
export class AdaptiveRedemptionQuota {
  code: string;
  label: string;
  summary: string;
  channel: string;
  version: number;
  openRate: number;
  status: AdaptiveRedemptionQuotaStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    channel: string,
    version: number,
    openRate: number,
    status: AdaptiveRedemptionQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.channel = channel;
    this.version = version;
    this.openRate = openRate;
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

  canMoveTo(next: AdaptiveRedemptionQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveRedemptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive redemption quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.version - this.openRate) * 100) / 100;
  }

  copy(): AdaptiveRedemptionQuota {
    return new AdaptiveRedemptionQuota(
      this.code,
      this.label,
      this.summary,
      this.channel,
      this.version,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive redemption quota in status draft. */
export function newAdaptiveRedemptionQuota(code: string, label: string): AdaptiveRedemptionQuota {
  return new AdaptiveRedemptionQuota(code, label, "", "", 0, 0, "draft");
}
