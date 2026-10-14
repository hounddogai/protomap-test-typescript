import * as text from "../../../../kit/text.js";

/** Where a weighted wait slot is in its life cycle. */
export type WeightedWaitSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One weighted wait slot, with what the planners need to act on it. */
export class WeightedWaitSlot {
  code: string;
  label: string;
  attributes: Map<string, string>;
  margin: number;
  approved: boolean;
  reviewer: string;
  weight: number;
  pinned: boolean;
  variant: string;
  locale: string;
  status: WeightedWaitSlotStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    margin: number,
    approved: boolean,
    reviewer: string,
    weight: number,
    pinned: boolean,
    variant: string,
    locale: string,
    status: WeightedWaitSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.margin = margin;
    this.approved = approved;
    this.reviewer = reviewer;
    this.weight = weight;
    this.pinned = pinned;
    this.variant = variant;
    this.locale = locale;
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

  canMoveTo(next: WeightedWaitSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WeightedWaitSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted wait slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted wait slot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round(this.weight * this.margin * 100) / 100;
  }

  copy(): WeightedWaitSlot {
    return new WeightedWaitSlot(
      this.code,
      this.label,
      this.attributes,
      this.margin,
      this.approved,
      this.reviewer,
      this.weight,
      this.pinned,
      this.variant,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted wait slot in status open. */
export function newWeightedWaitSlot(code: string, label: string): WeightedWaitSlot {
  return new WeightedWaitSlot(code, label, new Map<string, string>(), 0, false, "", 0, false, "", "", "open");
}
