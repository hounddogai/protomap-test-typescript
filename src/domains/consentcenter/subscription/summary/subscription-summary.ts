/**
 * The subscription summary records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription summary is in its life cycle. */
export type SubscriptionSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a subscription summary and its current status. */
export class SubscriptionSummary {
  code: string;
  title: string;
  revision: number;
  score: number;
  active: boolean;
  source: string;
  tags: string[];
  budget: number;
  unit: string;
  phone: string;
  status: SubscriptionSummaryStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    score: number,
    active: boolean,
    source: string,
    tags: string[],
    budget: number,
    unit: string,
    phone: string,
    status: SubscriptionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.score = score;
    this.active = active;
    this.source = source;
    this.tags = tags;
    this.budget = budget;
    this.unit = unit;
    this.phone = phone;
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

  canMoveTo(next: SubscriptionSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"subscription summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round(this.budget * this.score * 100) / 100;
  }

  copy(): SubscriptionSummary {
    return new SubscriptionSummary(
      this.code,
      this.title,
      this.revision,
      this.score,
      this.active,
      this.source,
      this.tags,
      this.budget,
      this.unit,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription summary in status requested. */
export function newSubscriptionSummary(code: string, title: string): SubscriptionSummary {
  return new SubscriptionSummary(code, title, 0, 0, false, "", [], 0, "", "", "requested");
}
