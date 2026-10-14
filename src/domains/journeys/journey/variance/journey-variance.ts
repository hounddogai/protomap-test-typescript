/**
 * The journey variance records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey variance is in its life cycle. */
export type JourneyVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a journey variance and its current status. */
export class JourneyVariance {
  code: string;
  label: string;
  locale: string;
  tags: string[];
  quantity: number;
  weight: number;
  externalRef: string;
  status: JourneyVarianceStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    tags: string[],
    quantity: number,
    weight: number,
    externalRef: string,
    status: JourneyVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.tags = tags;
    this.quantity = quantity;
    this.weight = weight;
    this.externalRef = externalRef;
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

  canMoveTo(next: JourneyVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: JourneyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey variance"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): JourneyVariance {
    return new JourneyVariance(
      this.code,
      this.label,
      this.locale,
      this.tags,
      this.quantity,
      this.weight,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a journey variance in status planned. */
export function newJourneyVariance(code: string, label: string): JourneyVariance {
  return new JourneyVariance(code, label, "", [], 0, 0, "", "planned");
}
