import * as text from "../../../../kit/text.js";

/** Where a fallback creative schedule is in its life cycle. */
export type FallbackCreativeScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback creative schedule. Its code is unique within a tenant. */
export class FallbackCreativeSchedule {
  code: string;
  label: string;
  attributes: Map<string, string>;
  rate: number;
  conversionRate: number;
  country: string;
  title: string;
  capacity: number;
  status: FallbackCreativeScheduleStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    rate: number,
    conversionRate: number,
    country: string,
    title: string,
    capacity: number,
    status: FallbackCreativeScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.country = country;
    this.title = title;
    this.capacity = capacity;
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

  canMoveTo(next: FallbackCreativeScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCreativeScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback creative schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback creative schedule"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.capacity + this.conversionRate) * 100) / 100;
  }

  copy(): FallbackCreativeSchedule {
    return new FallbackCreativeSchedule(
      this.code,
      this.label,
      this.attributes,
      this.rate,
      this.conversionRate,
      this.country,
      this.title,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback creative schedule in status planned. */
export function newFallbackCreativeSchedule(code: string, label: string): FallbackCreativeSchedule {
  return new FallbackCreativeSchedule(code, label, new Map<string, string>(), 0, 0, "", "", 0, "planned");
}
