import * as text from "../../../../kit/text.js";

/** Where a paywall request is in its life cycle. */
export type PaywallRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A paywall request as the paywall team keeps it. */
export class PaywallRequest {
  code: string;
  title: string;
  reviewer: string;
  region: string;
  endsAt: number;
  contactEmail: string;
  campaignRef: string;
  locale: string;
  segment: string;
  retries: number;
  version: number;
  status: PaywallRequestStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    region: string,
    endsAt: number,
    contactEmail: string,
    campaignRef: string,
    locale: string,
    segment: string,
    retries: number,
    version: number,
    status: PaywallRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.region = region;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.segment = segment;
    this.retries = retries;
    this.version = version;
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

  canMoveTo(next: PaywallRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PaywallRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.retries - this.endsAt) * 100) / 100;
  }

  copy(): PaywallRequest {
    return new PaywallRequest(
      this.code,
      this.title,
      this.reviewer,
      this.region,
      this.endsAt,
      this.contactEmail,
      this.campaignRef,
      this.locale,
      this.segment,
      this.retries,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a paywall request in status proposed. */
export function newPaywallRequest(code: string, title: string): PaywallRequest {
  return new PaywallRequest(code, title, "", "", 0, "", "", "", "", 0, 0, "proposed");
}
