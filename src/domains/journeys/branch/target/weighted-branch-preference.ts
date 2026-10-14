import * as text from "../../../../kit/text.js";

/** Where a weighted branch preference is in its life cycle. */
export type WeightedBranchPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted branch preference and its current status. */
export class WeightedBranchPreference {
  code: string;
  name: string;
  graceDays: number;
  retries: number;
  channel: string;
  approved: boolean;
  attributes: Map<string, string>;
  clicks: number;
  windowDays: number;
  limit: number;
  status: WeightedBranchPreferenceStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    retries: number,
    channel: string,
    approved: boolean,
    attributes: Map<string, string>,
    clicks: number,
    windowDays: number,
    limit: number,
    status: WeightedBranchPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.retries = retries;
    this.channel = channel;
    this.approved = approved;
    this.attributes = attributes;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.limit = limit;
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

  canMoveTo(next: WeightedBranchPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
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
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedBranchPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted branch preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.graceDays + this.windowDays) * 100) / 100;
  }

  copy(): WeightedBranchPreference {
    return new WeightedBranchPreference(
      this.code,
      this.name,
      this.graceDays,
      this.retries,
      this.channel,
      this.approved,
      this.attributes,
      this.clicks,
      this.windowDays,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted branch preference in status planned. */
export function newWeightedBranchPreference(code: string, name: string): WeightedBranchPreference {
  return new WeightedBranchPreference(code, name, 0, 0, "", false, new Map<string, string>(), 0, 0, 0, "planned");
}
