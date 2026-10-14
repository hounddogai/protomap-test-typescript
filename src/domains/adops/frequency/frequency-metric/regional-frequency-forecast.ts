import * as text from "../../../../kit/text.js";

/** Where a regional frequency forecast is in its life cycle. */
export type RegionalFrequencyForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional frequency forecast. Its code is unique within a tenant. */
export class RegionalFrequencyForecast {
  code: string;
  label: string;
  country: string;
  tags: string[];
  impressions: number;
  rate: number;
  region: string;
  locale: string;
  attributes: Map<string, string>;
  status: RegionalFrequencyForecastStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    tags: string[],
    impressions: number,
    rate: number,
    region: string,
    locale: string,
    attributes: Map<string, string>,
    status: RegionalFrequencyForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.tags = tags;
    this.impressions = impressions;
    this.rate = rate;
    this.region = region;
    this.locale = locale;
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

  canMoveTo(next: RegionalFrequencyForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalFrequencyForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional frequency forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional frequency forecast"} ${this.code}`;
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

  effectiveValue(): number {
    return Math.round(this.rate * this.impressions * 100) / 100;
  }

  copy(): RegionalFrequencyForecast {
    return new RegionalFrequencyForecast(
      this.code,
      this.label,
      this.country,
      this.tags,
      this.impressions,
      this.rate,
      this.region,
      this.locale,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional frequency forecast in status planned. */
export function newRegionalFrequencyForecast(code: string, label: string): RegionalFrequencyForecast {
  return new RegionalFrequencyForecast(code, label, "", [], 0, 0, "", "", new Map<string, string>(), "planned");
}
