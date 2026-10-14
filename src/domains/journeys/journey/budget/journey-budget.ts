/**
 * The journey budget records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey budget is in its life cycle. */
export type JourneyBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a journey budget and its current status. */
export class JourneyBudget {
  code: string;
  label: string;
  channel: string;
  category: string;
  retries: number;
  ownerId: string;
  externalRef: string;
  tags: string[];
  impressions: number;
  locale: string;
  discount: number;
  status: JourneyBudgetStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    category: string,
    retries: number,
    ownerId: string,
    externalRef: string,
    tags: string[],
    impressions: number,
    locale: string,
    discount: number,
    status: JourneyBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.category = category;
    this.retries = retries;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
    this.tags = tags;
    this.impressions = impressions;
    this.locale = locale;
    this.discount = discount;
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

  canMoveTo(next: JourneyBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.retries * this.impressions * 100) / 100;
  }

  copy(): JourneyBudget {
    return new JourneyBudget(
      this.code,
      this.label,
      this.channel,
      this.category,
      this.retries,
      this.ownerId,
      this.externalRef,
      this.tags,
      this.impressions,
      this.locale,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey budget in status draft. */
export function newJourneyBudget(code: string, label: string): JourneyBudget {
  return new JourneyBudget(code, label, "", "", 0, "", "", [], 0, "", 0, "draft");
}
