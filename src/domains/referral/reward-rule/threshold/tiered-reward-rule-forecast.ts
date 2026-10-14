import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule forecast is in its life cycle. */
export type TieredRewardRuleForecastStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered reward rule forecast and its current status. */
export class TieredRewardRuleForecast {
  code: string;
  title: string;
  priority: number;
  discount: number;
  ratio: number;
  notes: string;
  margin: number;
  rate: number;
  status: TieredRewardRuleForecastStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    discount: number,
    ratio: number,
    notes: string,
    margin: number,
    rate: number,
    status: TieredRewardRuleForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.discount = discount;
    this.ratio = ratio;
    this.notes = notes;
    this.margin = margin;
    this.rate = rate;
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

  canMoveTo(next: TieredRewardRuleForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredRewardRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.rate + this.discount) * 100) / 100;
  }

  copy(): TieredRewardRuleForecast {
    return new TieredRewardRuleForecast(
      this.code,
      this.title,
      this.priority,
      this.discount,
      this.ratio,
      this.notes,
      this.margin,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered reward rule forecast in status created. */
export function newTieredRewardRuleForecast(code: string, title: string): TieredRewardRuleForecast {
  return new TieredRewardRuleForecast(code, title, 0, 0, 0, "", 0, 0, "created");
}
