import * as text from "../../../../kit/text.js";

/** Where a frequency mapping is in its life cycle. */
export type FrequencyMappingStatus = "created" | "validated" | "published" | "retired";

/** One frequency mapping, with what the planners need to act on it. */
export class FrequencyMapping {
  code: string;
  name: string;
  margin: number;
  budget: number;
  clicks: number;
  conversionRate: number;
  minimum: number;
  timezone: string;
  threshold: number;
  phone: string;
  approved: boolean;
  status: FrequencyMappingStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    budget: number,
    clicks: number,
    conversionRate: number,
    minimum: number,
    timezone: string,
    threshold: number,
    phone: string,
    approved: boolean,
    status: FrequencyMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.budget = budget;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
    this.timezone = timezone;
    this.threshold = threshold;
    this.phone = phone;
    this.approved = approved;
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

  canMoveTo(next: FrequencyMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.budget + this.margin) * 100) / 100;
  }

  copy(): FrequencyMapping {
    return new FrequencyMapping(
      this.code,
      this.name,
      this.margin,
      this.budget,
      this.clicks,
      this.conversionRate,
      this.minimum,
      this.timezone,
      this.threshold,
      this.phone,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency mapping in status created. */
export function newFrequencyMapping(code: string, name: string): FrequencyMapping {
  return new FrequencyMapping(code, name, 0, 0, 0, 0, 0, "", 0, "", false, "created");
}
