import * as text from "../../../../kit/text.js";

/** Where a adaptive conversion quota is in its life cycle. */
export type AdaptiveConversionQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive conversion quota. Its code is unique within a tenant. */
export class AdaptiveConversionQuota {
  code: string;
  title: string;
  maximum: number;
  currency: string;
  openRate: number;
  approved: boolean;
  source: string;
  channel: string;
  active: boolean;
  updatedAt: number;
  sendAt: number;
  status: AdaptiveConversionQuotaStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    currency: string,
    openRate: number,
    approved: boolean,
    source: string,
    channel: string,
    active: boolean,
    updatedAt: number,
    sendAt: number,
    status: AdaptiveConversionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.currency = currency;
    this.openRate = openRate;
    this.approved = approved;
    this.source = source;
    this.channel = channel;
    this.active = active;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveConversionQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveConversionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive conversion quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive conversion quota"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.sendAt * this.updatedAt * 100) / 100;
  }

  copy(): AdaptiveConversionQuota {
    return new AdaptiveConversionQuota(
      this.code,
      this.title,
      this.maximum,
      this.currency,
      this.openRate,
      this.approved,
      this.source,
      this.channel,
      this.active,
      this.updatedAt,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive conversion quota in status planned. */
export function newAdaptiveConversionQuota(code: string, title: string): AdaptiveConversionQuota {
  return new AdaptiveConversionQuota(code, title, 0, "", 0, false, "", "", false, 0, 0, "planned");
}
