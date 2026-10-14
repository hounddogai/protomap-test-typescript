/**
 * The lenient reply claim records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient reply claim is in its life cycle. */
export type LenientReplyClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient reply claim and its current status. */
export class LenientReplyClaim {
  code: string;
  label: string;
  ratio: number;
  openRate: number;
  phone: string;
  createdAt: number;
  utmSource: string;
  currency: string;
  threshold: number;
  channel: string;
  reviewer: string;
  status: LenientReplyClaimStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    openRate: number,
    phone: string,
    createdAt: number,
    utmSource: string,
    currency: string,
    threshold: number,
    channel: string,
    reviewer: string,
    status: LenientReplyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.openRate = openRate;
    this.phone = phone;
    this.createdAt = createdAt;
    this.utmSource = utmSource;
    this.currency = currency;
    this.threshold = threshold;
    this.channel = channel;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientReplyClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"lenient reply claim"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.openRate * this.createdAt * 100) / 100;
  }

  copy(): LenientReplyClaim {
    return new LenientReplyClaim(
      this.code,
      this.label,
      this.ratio,
      this.openRate,
      this.phone,
      this.createdAt,
      this.utmSource,
      this.currency,
      this.threshold,
      this.channel,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient reply claim in status new. */
export function newLenientReplyClaim(code: string, label: string): LenientReplyClaim {
  return new LenientReplyClaim(code, label, 0, 0, "", 0, "", "", 0, "", "", "new");
}
