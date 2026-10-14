import * as text from "../../../../kit/text.js";

/** Where a regional queue preference is in its life cycle. */
export type RegionalQueuePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional queue preference and its current status. */
export class RegionalQueuePreference {
  code: string;
  name: string;
  bid: number;
  notes: string;
  ceiling: number;
  tags: string[];
  threshold: number;
  capacity: number;
  attributes: Map<string, string>;
  status: RegionalQueuePreferenceStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    notes: string,
    ceiling: number,
    tags: string[],
    threshold: number,
    capacity: number,
    attributes: Map<string, string>,
    status: RegionalQueuePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.notes = notes;
    this.ceiling = ceiling;
    this.tags = tags;
    this.threshold = threshold;
    this.capacity = capacity;
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

  canMoveTo(next: RegionalQueuePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalQueuePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.threshold + this.ceiling) * 100) / 100;
  }

  copy(): RegionalQueuePreference {
    return new RegionalQueuePreference(
      this.code,
      this.name,
      this.bid,
      this.notes,
      this.ceiling,
      this.tags,
      this.threshold,
      this.capacity,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional queue preference in status planned. */
export function newRegionalQueuePreference(code: string, name: string): RegionalQueuePreference {
  return new RegionalQueuePreference(code, name, 0, "", 0, [], 0, 0, new Map<string, string>(), "planned");
}
