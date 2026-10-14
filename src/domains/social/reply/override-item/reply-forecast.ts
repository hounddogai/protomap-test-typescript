import * as text from "../../../../kit/text.js";

/** Where a reply forecast is in its life cycle. */
export type ReplyForecastStatus = "created" | "validated" | "published" | "retired";

/** A reply forecast as the reply team keeps it. */
export class ReplyForecast {
  code: string;
  label: string;
  openRate: number;
  floorValue: number;
  name: string;
  attributes: Map<string, string>;
  attempts: number;
  graceDays: number;
  status: ReplyForecastStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    floorValue: number,
    name: string,
    attributes: Map<string, string>,
    attempts: number,
    graceDays: number,
    status: ReplyForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.floorValue = floorValue;
    this.name = name;
    this.attributes = attributes;
    this.attempts = attempts;
    this.graceDays = graceDays;
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

  canMoveTo(next: ReplyForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReplyForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  projectedExposure(): number {
    return Math.round((this.graceDays + this.floorValue) * 100) / 100;
  }

  copy(): ReplyForecast {
    return new ReplyForecast(
      this.code,
      this.label,
      this.openRate,
      this.floorValue,
      this.name,
      this.attributes,
      this.attempts,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply forecast in status created. */
export function newReplyForecast(code: string, label: string): ReplyForecast {
  return new ReplyForecast(code, label, 0, 0, "", new Map<string, string>(), 0, 0, "created");
}
