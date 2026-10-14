import * as text from "../../../../kit/text.js";

/** Where a subscription threshold is in its life cycle. */
export type SubscriptionThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** A subscription threshold as the subscription team keeps it. */
export class SubscriptionThreshold {
  code: string;
  title: string;
  ratio: number;
  version: number;
  campaignRef: string;
  contactEmail: string;
  utmSource: string;
  limit: number;
  status: SubscriptionThresholdStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    version: number,
    campaignRef: string,
    contactEmail: string,
    utmSource: string,
    limit: number,
    status: SubscriptionThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.version = version;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.limit = limit;
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

  canMoveTo(next: SubscriptionThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SubscriptionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round(this.version * this.ratio * 100) / 100;
  }

  copy(): SubscriptionThreshold {
    return new SubscriptionThreshold(
      this.code,
      this.title,
      this.ratio,
      this.version,
      this.campaignRef,
      this.contactEmail,
      this.utmSource,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a subscription threshold in status requested. */
export function newSubscriptionThreshold(code: string, title: string): SubscriptionThreshold {
  return new SubscriptionThreshold(code, title, 0, 0, "", "", "", 0, "requested");
}
