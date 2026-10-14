import * as text from "../../../../kit/text.js";

/** Where a badge summary is in its life cycle. */
export type BadgeSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One badge summary, with what the planners need to act on it. */
export class BadgeSummary {
  code: string;
  name: string;
  updatedAt: number;
  attributes: Map<string, string>;
  rate: number;
  windowDays: number;
  locale: string;
  status: BadgeSummaryStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    attributes: Map<string, string>,
    rate: number,
    windowDays: number,
    locale: string,
    status: BadgeSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.rate = rate;
    this.windowDays = windowDays;
    this.locale = locale;
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

  canMoveTo(next: BadgeSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BadgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round(this.rate * this.updatedAt * 100) / 100;
  }

  copy(): BadgeSummary {
    return new BadgeSummary(
      this.code,
      this.name,
      this.updatedAt,
      this.attributes,
      this.rate,
      this.windowDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a badge summary in status idle. */
export function newBadgeSummary(code: string, name: string): BadgeSummary {
  return new BadgeSummary(code, name, 0, new Map<string, string>(), 0, 0, "", "idle");
}
