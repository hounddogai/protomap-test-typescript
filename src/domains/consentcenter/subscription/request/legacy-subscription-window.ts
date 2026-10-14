import * as text from "../../../../kit/text.js";

/** Where a legacy subscription window is in its life cycle. */
export type LegacySubscriptionWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A legacy subscription window as the subscription team keeps it. */
export class LegacySubscriptionWindow {
  code: string;
  label: string;
  archived: boolean;
  budget: number;
  score: number;
  currency: string;
  bid: number;
  impressions: number;
  status: LegacySubscriptionWindowStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    budget: number,
    score: number,
    currency: string,
    bid: number,
    impressions: number,
    status: LegacySubscriptionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.budget = budget;
    this.score = score;
    this.currency = currency;
    this.bid = bid;
    this.impressions = impressions;
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

  canMoveTo(next: LegacySubscriptionWindowStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: LegacySubscriptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.budget - this.impressions) * 100) / 100;
  }

  copy(): LegacySubscriptionWindow {
    return new LegacySubscriptionWindow(
      this.code,
      this.label,
      this.archived,
      this.budget,
      this.score,
      this.currency,
      this.bid,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy subscription window in status open. */
export function newLegacySubscriptionWindow(code: string, label: string): LegacySubscriptionWindow {
  return new LegacySubscriptionWindow(code, label, false, 0, 0, "", 0, 0, "open");
}
