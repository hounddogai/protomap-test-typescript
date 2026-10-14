/**
 * The opt out forecast records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out forecast is in its life cycle. */
export type OptOutForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One opt out forecast, with what the planners need to act on it. */
export class OptOutForecast {
  code: string;
  label: string;
  tags: string[];
  capacity: number;
  name: string;
  status: OptOutForecastStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    capacity: number,
    name: string,
    status: OptOutForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.capacity = capacity;
    this.name = name;
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

  canMoveTo(next: OptOutForecastStatus): boolean {
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

  moveTo(next: OptOutForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): OptOutForecast {
    return new OptOutForecast(this.code, this.label, this.tags, this.capacity, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a opt out forecast in status planned. */
export function newOptOutForecast(code: string, label: string): OptOutForecast {
  return new OptOutForecast(code, label, [], 0, "", "planned");
}
