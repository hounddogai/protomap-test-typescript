import * as text from "../../../../kit/text.js";

/** Where a conversion window is in its life cycle. */
export type ConversionWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A conversion window as the conversion team keeps it. */
export class ConversionWindow {
  code: string;
  label: string;
  currency: string;
  pinned: boolean;
  tags: string[];
  durationMinutes: number;
  category: string;
  unit: string;
  conversionRate: number;
  cost: number;
  status: ConversionWindowStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    pinned: boolean,
    tags: string[],
    durationMinutes: number,
    category: string,
    unit: string,
    conversionRate: number,
    cost: number,
    status: ConversionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.pinned = pinned;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.category = category;
    this.unit = unit;
    this.conversionRate = conversionRate;
    this.cost = cost;
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

  canMoveTo(next: ConversionWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ConversionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"conversion window"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.durationMinutes + this.conversionRate) * 100) / 100;
  }

  copy(): ConversionWindow {
    return new ConversionWindow(
      this.code,
      this.label,
      this.currency,
      this.pinned,
      this.tags,
      this.durationMinutes,
      this.category,
      this.unit,
      this.conversionRate,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a conversion window in status open. */
export function newConversionWindow(code: string, label: string): ConversionWindow {
  return new ConversionWindow(code, label, "", false, [], 0, "", "", 0, 0, "open");
}
