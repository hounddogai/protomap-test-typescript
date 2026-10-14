/**
 * The manual bounce variance records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual bounce variance is in its life cycle. */
export type ManualBounceVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual bounce variance, with what the planners need to act on it. */
export class ManualBounceVariance {
  code: string;
  label: string;
  visible: boolean;
  amount: number;
  campaignRef: string;
  checksum: string;
  channel: string;
  status: ManualBounceVarianceStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    amount: number,
    campaignRef: string,
    checksum: string,
    channel: string,
    status: ManualBounceVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.checksum = checksum;
    this.channel = channel;
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

  canMoveTo(next: ManualBounceVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
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

  moveTo(next: ManualBounceVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ManualBounceVariance {
    return new ManualBounceVariance(
      this.code,
      this.label,
      this.visible,
      this.amount,
      this.campaignRef,
      this.checksum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual bounce variance in status draft. */
export function newManualBounceVariance(code: string, label: string): ManualBounceVariance {
  return new ManualBounceVariance(code, label, false, 0, "", "", "", "draft");
}
