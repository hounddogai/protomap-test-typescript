import * as text from "../../../../kit/text.js";

/** Where a fallback badge budget is in its life cycle. */
export type FallbackBadgeBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback badge budget as the badge team keeps it. */
export class FallbackBadgeBudget {
  code: string;
  title: string;
  impressions: number;
  frequencyCap: number;
  priority: number;
  capacity: number;
  description: string;
  contactEmail: string;
  status: FallbackBadgeBudgetStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    frequencyCap: number,
    priority: number,
    capacity: number,
    description: string,
    contactEmail: string,
    status: FallbackBadgeBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.priority = priority;
    this.capacity = capacity;
    this.description = description;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: FallbackBadgeBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackBadgeBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback badge budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.impressions - this.priority) * 100) / 100;
  }

  copy(): FallbackBadgeBudget {
    return new FallbackBadgeBudget(
      this.code,
      this.title,
      this.impressions,
      this.frequencyCap,
      this.priority,
      this.capacity,
      this.description,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback badge budget in status planned. */
export function newFallbackBadgeBudget(code: string, title: string): FallbackBadgeBudget {
  return new FallbackBadgeBudget(code, title, 0, 0, 0, 0, "", "", "planned");
}
