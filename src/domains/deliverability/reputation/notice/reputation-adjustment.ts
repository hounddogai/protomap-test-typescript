import * as text from "../../../../kit/text.js";

/** Where a reputation adjustment is in its life cycle. */
export type ReputationAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reputation adjustment as the reputation team keeps it. */
export class ReputationAdjustment {
  code: string;
  label: string;
  attributes: Map<string, string>;
  locale: string;
  floorValue: number;
  capacity: number;
  impressions: number;
  priority: number;
  journeyId: string;
  budget: number;
  status: ReputationAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    locale: string,
    floorValue: number,
    capacity: number,
    impressions: number,
    priority: number,
    journeyId: string,
    budget: number,
    status: ReputationAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.locale = locale;
    this.floorValue = floorValue;
    this.capacity = capacity;
    this.impressions = impressions;
    this.priority = priority;
    this.journeyId = journeyId;
    this.budget = budget;
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

  canMoveTo(next: ReputationAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReputationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.capacity - this.impressions) * 100) / 100;
  }

  copy(): ReputationAdjustment {
    return new ReputationAdjustment(
      this.code,
      this.label,
      this.attributes,
      this.locale,
      this.floorValue,
      this.capacity,
      this.impressions,
      this.priority,
      this.journeyId,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reputation adjustment in status planned. */
export function newReputationAdjustment(code: string, label: string): ReputationAdjustment {
  return new ReputationAdjustment(code, label, new Map<string, string>(), "", 0, 0, 0, 0, "", 0, "planned");
}
