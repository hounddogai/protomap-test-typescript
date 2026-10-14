import * as text from "../../../../kit/text.js";

/** Where a regional path forecast is in its life cycle. */
export type RegionalPathForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional path forecast, with what the planners need to act on it. */
export class RegionalPathForecast {
  code: string;
  title: string;
  attributes: Map<string, string>;
  tags: string[];
  openRate: number;
  weight: number;
  conversionRate: number;
  label: string;
  ceiling: number;
  channel: string;
  status: RegionalPathForecastStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    tags: string[],
    openRate: number,
    weight: number,
    conversionRate: number,
    label: string,
    ceiling: number,
    channel: string,
    status: RegionalPathForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.tags = tags;
    this.openRate = openRate;
    this.weight = weight;
    this.conversionRate = conversionRate;
    this.label = label;
    this.ceiling = ceiling;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPathForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPathForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional path forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
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

  projectedLoad(): number {
    return Math.round((this.conversionRate + this.ceiling) * 100) / 100;
  }

  copy(): RegionalPathForecast {
    return new RegionalPathForecast(
      this.code,
      this.title,
      this.attributes,
      this.tags,
      this.openRate,
      this.weight,
      this.conversionRate,
      this.label,
      this.ceiling,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional path forecast in status idle. */
export function newRegionalPathForecast(code: string, title: string): RegionalPathForecast {
  return new RegionalPathForecast(code, title, new Map<string, string>(), [], 0, 0, 0, "", 0, "", "idle");
}
