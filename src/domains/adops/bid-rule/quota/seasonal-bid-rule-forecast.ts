import * as text from "../../../../kit/text.js";

/** Where a seasonal bid rule forecast is in its life cycle. */
export type SeasonalBidRuleForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal bid rule forecast, with what the planners need to act on it. */
export class SeasonalBidRuleForecast {
  code: string;
  name: string;
  quantity: number;
  title: string;
  approved: boolean;
  endsAt: number;
  status: SeasonalBidRuleForecastStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    title: string,
    approved: boolean,
    endsAt: number,
    status: SeasonalBidRuleForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.title = title;
    this.approved = approved;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalBidRuleForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalBidRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bid rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.endsAt - this.quantity) * 100) / 100;
  }

  copy(): SeasonalBidRuleForecast {
    return new SeasonalBidRuleForecast(
      this.code,
      this.name,
      this.quantity,
      this.title,
      this.approved,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal bid rule forecast in status draft. */
export function newSeasonalBidRuleForecast(code: string, name: string): SeasonalBidRuleForecast {
  return new SeasonalBidRuleForecast(code, name, 0, "", false, 0, "draft");
}
