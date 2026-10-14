/**
 * The paywall review records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall review is in its life cycle. */
export type PaywallReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One paywall review, with what the planners need to act on it. */
export class PaywallReview {
  code: string;
  title: string;
  channel: string;
  impressions: number;
  name: string;
  description: string;
  priority: number;
  status: PaywallReviewStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    impressions: number,
    name: string,
    description: string,
    priority: number,
    status: PaywallReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.impressions = impressions;
    this.name = name;
    this.description = description;
    this.priority = priority;
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

  canMoveTo(next: PaywallReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PaywallReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.priority + this.impressions) * 100) / 100;
  }

  copy(): PaywallReview {
    return new PaywallReview(
      this.code,
      this.title,
      this.channel,
      this.impressions,
      this.name,
      this.description,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall review in status open. */
export function newPaywallReview(code: string, title: string): PaywallReview {
  return new PaywallReview(code, title, "", 0, "", "", 0, "open");
}
