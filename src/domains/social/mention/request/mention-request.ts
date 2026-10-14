/**
 * The mention request records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention request is in its life cycle. */
export type MentionRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One mention request, with what the planners need to act on it. */
export class MentionRequest {
  code: string;
  title: string;
  campaignRef: string;
  conversionRate: number;
  createdAt: number;
  floorValue: number;
  locale: string;
  discount: number;
  sequence: number;
  bid: number;
  cost: number;
  status: MentionRequestStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    conversionRate: number,
    createdAt: number,
    floorValue: number,
    locale: string,
    discount: number,
    sequence: number,
    bid: number,
    cost: number,
    status: MentionRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.locale = locale;
    this.discount = discount;
    this.sequence = sequence;
    this.bid = bid;
    this.cost = cost;
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

  canMoveTo(next: MentionRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MentionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.bid * this.createdAt * 100) / 100;
  }

  copy(): MentionRequest {
    return new MentionRequest(
      this.code,
      this.title,
      this.campaignRef,
      this.conversionRate,
      this.createdAt,
      this.floorValue,
      this.locale,
      this.discount,
      this.sequence,
      this.bid,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a mention request in status proposed. */
export function newMentionRequest(code: string, title: string): MentionRequest {
  return new MentionRequest(code, title, "", 0, 0, 0, "", 0, 0, 0, 0, "proposed");
}
