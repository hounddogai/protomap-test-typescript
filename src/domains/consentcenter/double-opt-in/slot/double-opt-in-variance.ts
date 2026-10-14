import * as text from "../../../../kit/text.js";

/** Where a double opt in variance is in its life cycle. */
export type DoubleOptInVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One double opt in variance, with what the planners need to act on it. */
export class DoubleOptInVariance {
  code: string;
  title: string;
  category: string;
  impressions: number;
  limit: number;
  weight: number;
  attributes: Map<string, string>;
  expiresAt: number;
  locale: string;
  timezone: string;
  name: string;
  status: DoubleOptInVarianceStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    impressions: number,
    limit: number,
    weight: number,
    attributes: Map<string, string>,
    expiresAt: number,
    locale: string,
    timezone: string,
    name: string,
    status: DoubleOptInVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.impressions = impressions;
    this.limit = limit;
    this.weight = weight;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.timezone = timezone;
    this.name = name;
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

  canMoveTo(next: DoubleOptInVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DoubleOptInVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions - this.limit) * 100) / 100;
  }

  copy(): DoubleOptInVariance {
    return new DoubleOptInVariance(
      this.code,
      this.title,
      this.category,
      this.impressions,
      this.limit,
      this.weight,
      this.attributes,
      this.expiresAt,
      this.locale,
      this.timezone,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a double opt in variance in status planned. */
export function newDoubleOptInVariance(code: string, title: string): DoubleOptInVariance {
  return new DoubleOptInVariance(code, title, "", 0, 0, 0, new Map<string, string>(), 0, "", "", "", "planned");
}
