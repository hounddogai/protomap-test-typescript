/**
 * The capped wait window records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped wait window is in its life cycle. */
export type CappedWaitWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped wait window. Its code is unique within a tenant. */
export class CappedWaitWindow {
  code: string;
  name: string;
  currency: string;
  ceiling: number;
  capacity: number;
  attributes: Map<string, string>;
  reviewer: string;
  category: string;
  unit: string;
  impressions: number;
  maximum: number;
  status: CappedWaitWindowStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    ceiling: number,
    capacity: number,
    attributes: Map<string, string>,
    reviewer: string,
    category: string,
    unit: string,
    impressions: number,
    maximum: number,
    status: CappedWaitWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.category = category;
    this.unit = unit;
    this.impressions = impressions;
    this.maximum = maximum;
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

  canMoveTo(next: CappedWaitWindowStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedWaitWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped wait window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
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

  copy(): CappedWaitWindow {
    return new CappedWaitWindow(
      this.code,
      this.name,
      this.currency,
      this.ceiling,
      this.capacity,
      this.attributes,
      this.reviewer,
      this.category,
      this.unit,
      this.impressions,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped wait window in status open. */
export function newCappedWaitWindow(code: string, name: string): CappedWaitWindow {
  return new CappedWaitWindow(code, name, "", 0, 0, new Map<string, string>(), "", "", "", 0, 0, "open");
}
