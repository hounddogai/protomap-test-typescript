import * as text from "../../../../kit/text.js";

/** Where a primary level window is in its life cycle. */
export type PrimaryLevelWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One primary level window, with what the planners need to act on it. */
export class PrimaryLevelWindow {
  code: string;
  name: string;
  conversionRate: number;
  category: string;
  label: string;
  notes: string;
  batchSize: number;
  discount: number;
  clicks: number;
  status: PrimaryLevelWindowStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    category: string,
    label: string,
    notes: string,
    batchSize: number,
    discount: number,
    clicks: number,
    status: PrimaryLevelWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.category = category;
    this.label = label;
    this.notes = notes;
    this.batchSize = batchSize;
    this.discount = discount;
    this.clicks = clicks;
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

  canMoveTo(next: PrimaryLevelWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryLevelWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary level window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary level window"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.conversionRate * this.batchSize * 100) / 100;
  }

  copy(): PrimaryLevelWindow {
    return new PrimaryLevelWindow(
      this.code,
      this.name,
      this.conversionRate,
      this.category,
      this.label,
      this.notes,
      this.batchSize,
      this.discount,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary level window in status planned. */
export function newPrimaryLevelWindow(code: string, name: string): PrimaryLevelWindow {
  return new PrimaryLevelWindow(code, name, 0, "", "", "", 0, 0, 0, "planned");
}
