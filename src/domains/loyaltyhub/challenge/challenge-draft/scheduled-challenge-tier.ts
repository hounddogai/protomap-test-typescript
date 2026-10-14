import * as text from "../../../../kit/text.js";

/** Where a scheduled challenge tier is in its life cycle. */
export type ScheduledChallengeTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled challenge tier as the challenge team keeps it. */
export class ScheduledChallengeTier {
  code: string;
  label: string;
  version: number;
  impressions: number;
  attributes: Map<string, string>;
  cohort: string;
  unit: string;
  region: string;
  status: ScheduledChallengeTierStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    impressions: number,
    attributes: Map<string, string>,
    cohort: string,
    unit: string,
    region: string,
    status: ScheduledChallengeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.impressions = impressions;
    this.attributes = attributes;
    this.cohort = cohort;
    this.unit = unit;
    this.region = region;
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

  canMoveTo(next: ScheduledChallengeTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
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

  moveTo(next: ScheduledChallengeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled challenge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.impressions - this.version) * 100) / 100;
  }

  copy(): ScheduledChallengeTier {
    return new ScheduledChallengeTier(
      this.code,
      this.label,
      this.version,
      this.impressions,
      this.attributes,
      this.cohort,
      this.unit,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled challenge tier in status planned. */
export function newScheduledChallengeTier(code: string, label: string): ScheduledChallengeTier {
  return new ScheduledChallengeTier(code, label, 0, 0, new Map<string, string>(), "", "", "", "planned");
}
