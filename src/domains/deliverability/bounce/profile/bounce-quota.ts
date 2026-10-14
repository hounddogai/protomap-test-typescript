import * as text from "../../../../kit/text.js";

/** Where a bounce quota is in its life cycle. */
export type BounceQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bounce quota. Its code is unique within a tenant. */
export class BounceQuota {
  code: string;
  title: string;
  channel: string;
  currency: string;
  visible: boolean;
  approved: boolean;
  campaignRef: string;
  weight: number;
  openRate: number;
  retries: number;
  status: BounceQuotaStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    currency: string,
    visible: boolean,
    approved: boolean,
    campaignRef: string,
    weight: number,
    openRate: number,
    retries: number,
    status: BounceQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.currency = currency;
    this.visible = visible;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.openRate = openRate;
    this.retries = retries;
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

  canMoveTo(next: BounceQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
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

  moveTo(next: BounceQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.openRate - this.retries) * 100) / 100;
  }

  copy(): BounceQuota {
    return new BounceQuota(
      this.code,
      this.title,
      this.channel,
      this.currency,
      this.visible,
      this.approved,
      this.campaignRef,
      this.weight,
      this.openRate,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce quota in status proposed. */
export function newBounceQuota(code: string, title: string): BounceQuota {
  return new BounceQuota(code, title, "", "", false, false, "", 0, 0, 0, "proposed");
}
