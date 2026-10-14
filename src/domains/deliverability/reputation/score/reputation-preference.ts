import * as text from "../../../../kit/text.js";

/** Where a reputation preference is in its life cycle. */
export type ReputationPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reputation preference. Its code is unique within a tenant. */
export class ReputationPreference {
  code: string;
  name: string;
  limit: number;
  notes: string;
  impressions: number;
  capacity: number;
  floorValue: number;
  createdAt: number;
  updatedAt: number;
  attributes: Map<string, string>;
  retries: number;
  status: ReputationPreferenceStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    notes: string,
    impressions: number,
    capacity: number,
    floorValue: number,
    createdAt: number,
    updatedAt: number,
    attributes: Map<string, string>,
    retries: number,
    status: ReputationPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.notes = notes;
    this.impressions = impressions;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.retries = retries;
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

  canMoveTo(next: ReputationPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: ReputationPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reputation preference"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round((this.retries + this.createdAt) * 100) / 100;
  }

  copy(): ReputationPreference {
    return new ReputationPreference(
      this.code,
      this.name,
      this.limit,
      this.notes,
      this.impressions,
      this.capacity,
      this.floorValue,
      this.createdAt,
      this.updatedAt,
      this.attributes,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reputation preference in status planned. */
export function newReputationPreference(code: string, name: string): ReputationPreference {
  return new ReputationPreference(code, name, 0, "", 0, 0, 0, 0, 0, new Map<string, string>(), 0, "planned");
}
