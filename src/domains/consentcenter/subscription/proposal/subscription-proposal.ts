/**
 * The subscription proposal records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription proposal is in its life cycle. */
export type SubscriptionProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A subscription proposal as the subscription team keeps it. */
export class SubscriptionProposal {
  code: string;
  label: string;
  ceiling: number;
  floorValue: number;
  createdAt: number;
  utmSource: string;
  status: SubscriptionProposalStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    floorValue: number,
    createdAt: number,
    utmSource: string,
    status: SubscriptionProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
    this.utmSource = utmSource;
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

  canMoveTo(next: SubscriptionProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"subscription proposal"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.ceiling + this.floorValue) * 100) / 100;
  }

  copy(): SubscriptionProposal {
    return new SubscriptionProposal(
      this.code,
      this.label,
      this.ceiling,
      this.floorValue,
      this.createdAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a subscription proposal in status proposed. */
export function newSubscriptionProposal(code: string, label: string): SubscriptionProposal {
  return new SubscriptionProposal(code, label, 0, 0, 0, "", "proposed");
}
