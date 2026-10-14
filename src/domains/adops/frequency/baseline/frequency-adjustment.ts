import * as text from "../../../../kit/text.js";

/** Where a frequency adjustment is in its life cycle. */
export type FrequencyAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A frequency adjustment as the frequency team keeps it. */
export class FrequencyAdjustment {
  code: string;
  name: string;
  unit: string;
  ceiling: number;
  locale: string;
  windowDays: number;
  quantity: number;
  attributes: Map<string, string>;
  status: FrequencyAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    ceiling: number,
    locale: string,
    windowDays: number,
    quantity: number,
    attributes: Map<string, string>,
    status: FrequencyAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.ceiling = ceiling;
    this.locale = locale;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.attributes = attributes;
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

  canMoveTo(next: FrequencyAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: FrequencyAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"frequency adjustment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round(this.windowDays * this.quantity * 100) / 100;
  }

  copy(): FrequencyAdjustment {
    return new FrequencyAdjustment(
      this.code,
      this.name,
      this.unit,
      this.ceiling,
      this.locale,
      this.windowDays,
      this.quantity,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a frequency adjustment in status planned. */
export function newFrequencyAdjustment(code: string, name: string): FrequencyAdjustment {
  return new FrequencyAdjustment(code, name, "", 0, "", 0, 0, new Map<string, string>(), "planned");
}
