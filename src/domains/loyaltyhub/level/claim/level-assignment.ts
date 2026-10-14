import * as text from "../../../../kit/text.js";

/** Where a level assignment is in its life cycle. */
export type LevelAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A level assignment. Its code is unique within a tenant. */
export class LevelAssignment {
  code: string;
  label: string;
  rate: number;
  description: string;
  budget: number;
  country: string;
  ratio: number;
  attributes: Map<string, string>;
  externalRef: string;
  bid: number;
  status: LevelAssignmentStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    description: string,
    budget: number,
    country: string,
    ratio: number,
    attributes: Map<string, string>,
    externalRef: string,
    bid: number,
    status: LevelAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.description = description;
    this.budget = budget;
    this.country = country;
    this.ratio = ratio;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.bid = bid;
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

  canMoveTo(next: LevelAssignmentStatus): boolean {
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
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LevelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.budget - this.rate) * 100) / 100;
  }

  copy(): LevelAssignment {
    return new LevelAssignment(
      this.code,
      this.label,
      this.rate,
      this.description,
      this.budget,
      this.country,
      this.ratio,
      this.attributes,
      this.externalRef,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a level assignment in status planned. */
export function newLevelAssignment(code: string, label: string): LevelAssignment {
  return new LevelAssignment(code, label, 0, "", 0, "", 0, new Map<string, string>(), "", 0, "planned");
}
