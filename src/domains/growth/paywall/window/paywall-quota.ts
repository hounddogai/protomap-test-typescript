import * as text from "../../../../kit/text.js";

/** Where a paywall quota is in its life cycle. */
export type PaywallQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** One paywall quota, with what the planners need to act on it. */
export class PaywallQuota {
  code: string;
  title: string;
  visible: boolean;
  priority: number;
  description: string;
  channel: string;
  name: string;
  ownerId: string;
  campaignRef: string;
  batchSize: number;
  region: string;
  status: PaywallQuotaStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    priority: number,
    description: string,
    channel: string,
    name: string,
    ownerId: string,
    campaignRef: string,
    batchSize: number,
    region: string,
    status: PaywallQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.priority = priority;
    this.description = description;
    this.channel = channel;
    this.name = name;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.region = region;
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

  canMoveTo(next: PaywallQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: PaywallQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"paywall quota"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.priority * this.batchSize * 100) / 100;
  }

  copy(): PaywallQuota {
    return new PaywallQuota(
      this.code,
      this.title,
      this.visible,
      this.priority,
      this.description,
      this.channel,
      this.name,
      this.ownerId,
      this.campaignRef,
      this.batchSize,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall quota in status requested. */
export function newPaywallQuota(code: string, title: string): PaywallQuota {
  return new PaywallQuota(code, title, false, 0, "", "", "", "", "", 0, "", "requested");
}
