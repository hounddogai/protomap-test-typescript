import * as text from "../../../../kit/text.js";

/** Where a subscription milestone is in its life cycle. */
export type SubscriptionMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a subscription milestone and its current status. */
export class SubscriptionMilestone {
  code: string;
  title: string;
  priority: number;
  quantity: number;
  attributes: Map<string, string>;
  budget: number;
  endsAt: number;
  country: string;
  approved: boolean;
  locale: string;
  status: SubscriptionMilestoneStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    quantity: number,
    attributes: Map<string, string>,
    budget: number,
    endsAt: number,
    country: string,
    approved: boolean,
    locale: string,
    status: SubscriptionMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.quantity = quantity;
    this.attributes = attributes;
    this.budget = budget;
    this.endsAt = endsAt;
    this.country = country;
    this.approved = approved;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.quantity * this.priority * 100) / 100;
  }

  copy(): SubscriptionMilestone {
    return new SubscriptionMilestone(
      this.code,
      this.title,
      this.priority,
      this.quantity,
      this.attributes,
      this.budget,
      this.endsAt,
      this.country,
      this.approved,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a subscription milestone in status planned. */
export function newSubscriptionMilestone(code: string, title: string): SubscriptionMilestone {
  return new SubscriptionMilestone(code, title, 0, 0, new Map<string, string>(), 0, 0, "", false, "", "planned");
}
