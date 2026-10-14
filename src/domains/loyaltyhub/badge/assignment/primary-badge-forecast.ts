import * as text from "../../../../kit/text.js";

/** Where a primary badge forecast is in its life cycle. */
export type PrimaryBadgeForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary badge forecast. Its code is unique within a tenant. */
export class PrimaryBadgeForecast {
  code: string;
  title: string;
  tags: string[];
  pinned: boolean;
  source: string;
  locale: string;
  region: string;
  score: number;
  status: PrimaryBadgeForecastStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    pinned: boolean,
    source: string,
    locale: string,
    region: string,
    score: number,
    status: PrimaryBadgeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.pinned = pinned;
    this.source = source;
    this.locale = locale;
    this.region = region;
    this.score = score;
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

  canMoveTo(next: PrimaryBadgeForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBadgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary badge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary badge forecast"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimaryBadgeForecast {
    return new PrimaryBadgeForecast(
      this.code,
      this.title,
      this.tags,
      this.pinned,
      this.source,
      this.locale,
      this.region,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary badge forecast in status idle. */
export function newPrimaryBadgeForecast(code: string, title: string): PrimaryBadgeForecast {
  return new PrimaryBadgeForecast(code, title, [], false, "", "", "", 0, "idle");
}
