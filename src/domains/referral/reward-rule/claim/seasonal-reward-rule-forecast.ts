import * as text from "../../../../kit/text.js";

/** Where a seasonal reward rule forecast is in its life cycle. */
export type SeasonalRewardRuleForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal reward rule forecast. Its code is unique within a tenant. */
export class SeasonalRewardRuleForecast {
  code: string;
  name: string;
  budget: number;
  floorValue: number;
  sequence: number;
  status: SeasonalRewardRuleForecastStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    floorValue: number,
    sequence: number,
    status: SeasonalRewardRuleForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.floorValue = floorValue;
    this.sequence = sequence;
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

  canMoveTo(next: SeasonalRewardRuleForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalRewardRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.sequence * 100) / 100;
  }

  copy(): SeasonalRewardRuleForecast {
    return new SeasonalRewardRuleForecast(
      this.code,
      this.name,
      this.budget,
      this.floorValue,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal reward rule forecast in status idle. */
export function newSeasonalRewardRuleForecast(code: string, name: string): SeasonalRewardRuleForecast {
  return new SeasonalRewardRuleForecast(code, name, 0, 0, 0, "idle");
}
