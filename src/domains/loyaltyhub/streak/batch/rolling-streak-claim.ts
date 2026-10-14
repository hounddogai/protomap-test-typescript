import * as text from "../../../../kit/text.js";

/** Where a rolling streak claim is in its life cycle. */
export type RollingStreakClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling streak claim, with what the planners need to act on it. */
export class RollingStreakClaim {
  code: string;
  label: string;
  version: number;
  windowDays: number;
  attributes: Map<string, string>;
  locale: string;
  ceiling: number;
  campaignRef: string;
  category: string;
  unit: string;
  status: RollingStreakClaimStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    windowDays: number,
    attributes: Map<string, string>,
    locale: string,
    ceiling: number,
    campaignRef: string,
    category: string,
    unit: string,
    status: RollingStreakClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.locale = locale;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.category = category;
    this.unit = unit;
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

  canMoveTo(next: RollingStreakClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
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

  moveTo(next: RollingStreakClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling streak claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
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

  projectedTotal(): number {
    return Math.round((this.version - this.windowDays) * 100) / 100;
  }

  copy(): RollingStreakClaim {
    return new RollingStreakClaim(
      this.code,
      this.label,
      this.version,
      this.windowDays,
      this.attributes,
      this.locale,
      this.ceiling,
      this.campaignRef,
      this.category,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling streak claim in status planned. */
export function newRollingStreakClaim(code: string, label: string): RollingStreakClaim {
  return new RollingStreakClaim(code, label, 0, 0, new Map<string, string>(), "", 0, "", "", "", "planned");
}
