import * as text from "../../../../kit/text.js";

/** Where a retention preference is in its life cycle. */
export type RetentionPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a retention preference and its current status. */
export class RetentionPreference {
  code: string;
  name: string;
  unit: string;
  region: string;
  budget: number;
  updatedAt: number;
  windowDays: number;
  title: string;
  country: string;
  ownerId: string;
  status: RetentionPreferenceStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    region: string,
    budget: number,
    updatedAt: number,
    windowDays: number,
    title: string,
    country: string,
    ownerId: string,
    status: RetentionPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.region = region;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.windowDays = windowDays;
    this.title = title;
    this.country = country;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RetentionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.windowDays - this.updatedAt) * 100) / 100;
  }

  copy(): RetentionPreference {
    return new RetentionPreference(
      this.code,
      this.name,
      this.unit,
      this.region,
      this.budget,
      this.updatedAt,
      this.windowDays,
      this.title,
      this.country,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a retention preference in status proposed. */
export function newRetentionPreference(code: string, name: string): RetentionPreference {
  return new RetentionPreference(code, name, "", "", 0, 0, 0, "", "", "", "proposed");
}
