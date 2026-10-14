/**
 * The subscription agreement records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription agreement is in its life cycle. */
export type SubscriptionAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A subscription agreement as the subscription team keeps it. */
export class SubscriptionAgreement {
  code: string;
  title: string;
  region: string;
  active: boolean;
  impressions: number;
  reviewer: string;
  openRate: number;
  pinned: boolean;
  maximum: number;
  amount: number;
  description: string;
  status: SubscriptionAgreementStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    active: boolean,
    impressions: number,
    reviewer: string,
    openRate: number,
    pinned: boolean,
    maximum: number,
    amount: number,
    description: string,
    status: SubscriptionAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.active = active;
    this.impressions = impressions;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.pinned = pinned;
    this.maximum = maximum;
    this.amount = amount;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SubscriptionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"subscription agreement"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.openRate * this.amount * 100) / 100;
  }

  copy(): SubscriptionAgreement {
    return new SubscriptionAgreement(
      this.code,
      this.title,
      this.region,
      this.active,
      this.impressions,
      this.reviewer,
      this.openRate,
      this.pinned,
      this.maximum,
      this.amount,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a subscription agreement in status open. */
export function newSubscriptionAgreement(code: string, title: string): SubscriptionAgreement {
  return new SubscriptionAgreement(code, title, "", false, 0, "", 0, false, 0, 0, "", "open");
}
