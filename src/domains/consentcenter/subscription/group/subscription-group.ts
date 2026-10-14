/**
 * The subscription group records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription group is in its life cycle. */
export type SubscriptionGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A subscription group as the subscription team keeps it. */
export class SubscriptionGroup {
  code: string;
  title: string;
  contactEmail: string;
  conversionRate: number;
  name: string;
  weight: number;
  source: string;
  description: string;
  graceDays: number;
  reviewer: string;
  status: SubscriptionGroupStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    conversionRate: number,
    name: string,
    weight: number,
    source: string,
    description: string,
    graceDays: number,
    reviewer: string,
    status: SubscriptionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.name = name;
    this.weight = weight;
    this.source = source;
    this.description = description;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
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

  canMoveTo(next: SubscriptionGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SubscriptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"subscription group"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.graceDays * this.weight * 100) / 100;
  }

  copy(): SubscriptionGroup {
    return new SubscriptionGroup(
      this.code,
      this.title,
      this.contactEmail,
      this.conversionRate,
      this.name,
      this.weight,
      this.source,
      this.description,
      this.graceDays,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription group in status open. */
export function newSubscriptionGroup(code: string, title: string): SubscriptionGroup {
  return new SubscriptionGroup(code, title, "", 0, "", 0, "", "", 0, "", "open");
}
