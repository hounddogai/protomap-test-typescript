import * as text from "../../../../kit/text.js";

/** Where a weighted reputation forecast is in its life cycle. */
export type WeightedReputationForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One weighted reputation forecast, with what the planners need to act on it. */
export class WeightedReputationForecast {
  code: string;
  title: string;
  version: number;
  locale: string;
  score: number;
  country: string;
  weight: number;
  quantity: number;
  sendAt: number;
  status: WeightedReputationForecastStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    locale: string,
    score: number,
    country: string,
    weight: number,
    quantity: number,
    sendAt: number,
    status: WeightedReputationForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.locale = locale;
    this.score = score;
    this.country = country;
    this.weight = weight;
    this.quantity = quantity;
    this.sendAt = sendAt;
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

  canMoveTo(next: WeightedReputationForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedReputationForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.sendAt - this.quantity) * 100) / 100;
  }

  copy(): WeightedReputationForecast {
    return new WeightedReputationForecast(
      this.code,
      this.title,
      this.version,
      this.locale,
      this.score,
      this.country,
      this.weight,
      this.quantity,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted reputation forecast in status planned. */
export function newWeightedReputationForecast(code: string, title: string): WeightedReputationForecast {
  return new WeightedReputationForecast(code, title, 0, "", 0, "", 0, 0, 0, "planned");
}
