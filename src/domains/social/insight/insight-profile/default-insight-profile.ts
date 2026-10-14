/**
 * The default insight profile records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default insight profile is in its life cycle. */
export type DefaultInsightProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default insight profile as the insight team keeps it. */
export class DefaultInsightProfile {
  code: string;
  label: string;
  attributes: Map<string, string>;
  unit: string;
  phone: string;
  windowDays: number;
  minimum: number;
  status: DefaultInsightProfileStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    unit: string,
    phone: string,
    windowDays: number,
    minimum: number,
    status: DefaultInsightProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.unit = unit;
    this.phone = phone;
    this.windowDays = windowDays;
    this.minimum = minimum;
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

  canMoveTo(next: DefaultInsightProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultInsightProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default insight profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.windowDays + this.minimum) * 100) / 100;
  }

  copy(): DefaultInsightProfile {
    return new DefaultInsightProfile(
      this.code,
      this.label,
      this.attributes,
      this.unit,
      this.phone,
      this.windowDays,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default insight profile in status planned. */
export function newDefaultInsightProfile(code: string, label: string): DefaultInsightProfile {
  return new DefaultInsightProfile(code, label, new Map<string, string>(), "", "", 0, 0, "planned");
}
