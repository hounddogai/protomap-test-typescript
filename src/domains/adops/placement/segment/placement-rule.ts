import * as text from "../../../../kit/text.js";

/** Where a placement rule is in its life cycle. */
export type PlacementRuleStatus = "created" | "validated" | "published" | "retired";

/** One placement rule, with what the planners need to act on it. */
export class PlacementRule {
  code: string;
  label: string;
  margin: number;
  windowDays: number;
  ownerId: string;
  status: PlacementRuleStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    windowDays: number,
    ownerId: string,
    status: PlacementRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementRuleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.windowDays) * 100) / 100;
  }

  copy(): PlacementRule {
    return new PlacementRule(this.code, this.label, this.margin, this.windowDays, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement rule in status created. */
export function newPlacementRule(code: string, label: string): PlacementRule {
  return new PlacementRule(code, label, 0, 0, "", "created");
}
