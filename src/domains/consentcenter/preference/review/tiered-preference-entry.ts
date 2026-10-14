import * as text from "../../../../kit/text.js";

/** Where a tiered preference entry is in its life cycle. */
export type TieredPreferenceEntryStatus = "created" | "validated" | "published" | "retired";

/** A tiered preference entry. Its code is unique within a tenant. */
export class TieredPreferenceEntry {
  code: string;
  title: string;
  endsAt: number;
  version: number;
  conversionRate: number;
  threshold: number;
  cohort: string;
  name: string;
  status: TieredPreferenceEntryStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    version: number,
    conversionRate: number,
    threshold: number,
    cohort: string,
    name: string,
    status: TieredPreferenceEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.version = version;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.cohort = cohort;
    this.name = name;
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

  canMoveTo(next: TieredPreferenceEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredPreferenceEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered preference entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold + this.endsAt) * 100) / 100;
  }

  copy(): TieredPreferenceEntry {
    return new TieredPreferenceEntry(
      this.code,
      this.title,
      this.endsAt,
      this.version,
      this.conversionRate,
      this.threshold,
      this.cohort,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered preference entry in status created. */
export function newTieredPreferenceEntry(code: string, title: string): TieredPreferenceEntry {
  return new TieredPreferenceEntry(code, title, 0, 0, 0, 0, "", "", "created");
}
