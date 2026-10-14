import * as text from "../../../../kit/text.js";

/** Where a seasonal window forecast is in its life cycle. */
export type SeasonalWindowForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a seasonal window forecast and its current status. */
export class SeasonalWindowForecast {
  code: string;
  name: string;
  openRate: number;
  ratio: number;
  visible: boolean;
  cost: number;
  description: string;
  frequencyCap: number;
  clicks: number;
  contactEmail: string;
  status: SeasonalWindowForecastStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    ratio: number,
    visible: boolean,
    cost: number,
    description: string,
    frequencyCap: number,
    clicks: number,
    contactEmail: string,
    status: SeasonalWindowForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.ratio = ratio;
    this.visible = visible;
    this.cost = cost;
    this.description = description;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: SeasonalWindowForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalWindowForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal window forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.clicks * this.cost * 100) / 100;
  }

  copy(): SeasonalWindowForecast {
    return new SeasonalWindowForecast(
      this.code,
      this.name,
      this.openRate,
      this.ratio,
      this.visible,
      this.cost,
      this.description,
      this.frequencyCap,
      this.clicks,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal window forecast in status draft. */
export function newSeasonalWindowForecast(code: string, name: string): SeasonalWindowForecast {
  return new SeasonalWindowForecast(code, name, 0, 0, false, 0, "", 0, 0, "", "draft");
}
