import * as text from "../../../../kit/text.js";

/** Where a primary frequency window is in its life cycle. */
export type PrimaryFrequencyWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary frequency window and its current status. */
export class PrimaryFrequencyWindow {
  code: string;
  name: string;
  margin: number;
  openRate: number;
  budget: number;
  category: string;
  status: PrimaryFrequencyWindowStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    openRate: number,
    budget: number,
    category: string,
    status: PrimaryFrequencyWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.openRate = openRate;
    this.budget = budget;
    this.category = category;
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

  canMoveTo(next: PrimaryFrequencyWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryFrequencyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary frequency window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary frequency window"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.margin - this.budget) * 100) / 100;
  }

  copy(): PrimaryFrequencyWindow {
    return new PrimaryFrequencyWindow(
      this.code,
      this.name,
      this.margin,
      this.openRate,
      this.budget,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary frequency window in status open. */
export function newPrimaryFrequencyWindow(code: string, name: string): PrimaryFrequencyWindow {
  return new PrimaryFrequencyWindow(code, name, 0, 0, 0, "", "open");
}
