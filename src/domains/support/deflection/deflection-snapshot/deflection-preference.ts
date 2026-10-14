import * as text from "../../../../kit/text.js";

/** Where a deflection preference is in its life cycle. */
export type DeflectionPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a deflection preference and its current status. */
export class DeflectionPreference {
  code: string;
  name: string;
  category: string;
  endsAt: number;
  capacity: number;
  bid: number;
  budget: number;
  externalRef: string;
  status: DeflectionPreferenceStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    endsAt: number,
    capacity: number,
    bid: number,
    budget: number,
    externalRef: string,
    status: DeflectionPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.endsAt = endsAt;
    this.capacity = capacity;
    this.bid = bid;
    this.budget = budget;
    this.externalRef = externalRef;
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

  canMoveTo(next: DeflectionPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DeflectionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.budget + this.capacity) * 100) / 100;
  }

  copy(): DeflectionPreference {
    return new DeflectionPreference(
      this.code,
      this.name,
      this.category,
      this.endsAt,
      this.capacity,
      this.bid,
      this.budget,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a deflection preference in status planned. */
export function newDeflectionPreference(code: string, name: string): DeflectionPreference {
  return new DeflectionPreference(code, name, "", 0, 0, 0, 0, "", "planned");
}
