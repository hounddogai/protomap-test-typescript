import * as text from "../../../../kit/text.js";

/** Where a bid rule forecast is in its life cycle. */
export type BidRuleForecastStatus = "created" | "validated" | "published" | "retired";

/** The record of a bid rule forecast and its current status. */
export class BidRuleForecast {
  code: string;
  name: string;
  margin: number;
  minimum: number;
  sequence: number;
  status: BidRuleForecastStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    minimum: number,
    sequence: number,
    status: BidRuleForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.minimum = minimum;
    this.sequence = sequence;
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

  canMoveTo(next: BidRuleForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bid rule forecast"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.margin * this.minimum * 100) / 100;
  }

  copy(): BidRuleForecast {
    return new BidRuleForecast(this.code, this.name, this.margin, this.minimum, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule forecast in status created. */
export function newBidRuleForecast(code: string, name: string): BidRuleForecast {
  return new BidRuleForecast(code, name, 0, 0, 0, "created");
}
