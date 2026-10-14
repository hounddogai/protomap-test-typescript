import * as text from "../../../../kit/text.js";

/** Where a strict placement forecast is in its life cycle. */
export type StrictPlacementForecastStatus = "created" | "validated" | "published" | "retired";

/** One strict placement forecast, with what the planners need to act on it. */
export class StrictPlacementForecast {
  code: string;
  title: string;
  locale: string;
  channel: string;
  ratio: number;
  updatedAt: number;
  budget: number;
  variant: string;
  maximum: number;
  contactEmail: string;
  status: StrictPlacementForecastStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    channel: string,
    ratio: number,
    updatedAt: number,
    budget: number,
    variant: string,
    maximum: number,
    contactEmail: string,
    status: StrictPlacementForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.channel = channel;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.variant = variant;
    this.maximum = maximum;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: StrictPlacementForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPlacementForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict placement forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.updatedAt - this.maximum) * 100) / 100;
  }

  copy(): StrictPlacementForecast {
    return new StrictPlacementForecast(
      this.code,
      this.title,
      this.locale,
      this.channel,
      this.ratio,
      this.updatedAt,
      this.budget,
      this.variant,
      this.maximum,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict placement forecast in status created. */
export function newStrictPlacementForecast(code: string, title: string): StrictPlacementForecast {
  return new StrictPlacementForecast(code, title, "", "", 0, 0, 0, "", 0, "", "created");
}
