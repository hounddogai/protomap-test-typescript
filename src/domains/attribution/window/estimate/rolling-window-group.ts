import * as text from "../../../../kit/text.js";

/** Where a rolling window group is in its life cycle. */
export type RollingWindowGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling window group as the window team keeps it. */
export class RollingWindowGroup {
  code: string;
  title: string;
  rate: number;
  conversionRate: number;
  description: string;
  limit: number;
  currency: string;
  locale: string;
  clicks: number;
  ceiling: number;
  ratio: number;
  status: RollingWindowGroupStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    conversionRate: number,
    description: string,
    limit: number,
    currency: string,
    locale: string,
    clicks: number,
    ceiling: number,
    ratio: number,
    status: RollingWindowGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.description = description;
    this.limit = limit;
    this.currency = currency;
    this.locale = locale;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWindowGroupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingWindowGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling window group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.clicks + this.ratio) * 100) / 100;
  }

  copy(): RollingWindowGroup {
    return new RollingWindowGroup(
      this.code,
      this.title,
      this.rate,
      this.conversionRate,
      this.description,
      this.limit,
      this.currency,
      this.locale,
      this.clicks,
      this.ceiling,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling window group in status new. */
export function newRollingWindowGroup(code: string, title: string): RollingWindowGroup {
  return new RollingWindowGroup(code, title, 0, 0, "", 0, "", "", 0, 0, 0, "new");
}
