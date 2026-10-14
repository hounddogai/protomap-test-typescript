import * as text from "../../../../kit/text.js";

/** Where a retention mapping is in its life cycle. */
export type RetentionMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One retention mapping, with what the planners need to act on it. */
export class RetentionMapping {
  code: string;
  title: string;
  pinned: boolean;
  variant: string;
  windowDays: number;
  locale: string;
  impressions: number;
  attributes: Map<string, string>;
  cost: number;
  status: RetentionMappingStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    variant: string,
    windowDays: number,
    locale: string,
    impressions: number,
    attributes: Map<string, string>,
    cost: number,
    status: RetentionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.variant = variant;
    this.windowDays = windowDays;
    this.locale = locale;
    this.impressions = impressions;
    this.attributes = attributes;
    this.cost = cost;
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

  canMoveTo(next: RetentionMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: RetentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round(this.windowDays * this.cost * 100) / 100;
  }

  copy(): RetentionMapping {
    return new RetentionMapping(
      this.code,
      this.title,
      this.pinned,
      this.variant,
      this.windowDays,
      this.locale,
      this.impressions,
      this.attributes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a retention mapping in status planned. */
export function newRetentionMapping(code: string, title: string): RetentionMapping {
  return new RetentionMapping(code, title, false, "", 0, "", 0, new Map<string, string>(), 0, "planned");
}
