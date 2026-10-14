import * as text from "../../../../kit/text.js";

/** Where a subscription tier is in its life cycle. */
export type SubscriptionTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a subscription tier and its current status. */
export class SubscriptionTier {
  code: string;
  label: string;
  frequencyCap: number;
  budget: number;
  impressions: number;
  visible: boolean;
  approved: boolean;
  expiresAt: number;
  status: SubscriptionTierStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    budget: number,
    impressions: number,
    visible: boolean,
    approved: boolean,
    expiresAt: number,
    status: SubscriptionTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.impressions = impressions;
    this.visible = visible;
    this.approved = approved;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: SubscriptionTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.impressions + this.budget) * 100) / 100;
  }

  copy(): SubscriptionTier {
    return new SubscriptionTier(
      this.code,
      this.label,
      this.frequencyCap,
      this.budget,
      this.impressions,
      this.visible,
      this.approved,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a subscription tier in status proposed. */
export function newSubscriptionTier(code: string, label: string): SubscriptionTier {
  return new SubscriptionTier(code, label, 0, 0, 0, false, false, 0, "proposed");
}
