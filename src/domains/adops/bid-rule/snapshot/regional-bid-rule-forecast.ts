import * as text from "../../../../kit/text.js";

/** Where a regional bid rule forecast is in its life cycle. */
export type RegionalBidRuleForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a regional bid rule forecast and its current status. */
export class RegionalBidRuleForecast {
  code: string;
  label: string;
  quantity: number;
  channel: string;
  retries: number;
  sendAt: number;
  status: RegionalBidRuleForecastStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    channel: string,
    retries: number,
    sendAt: number,
    status: RegionalBidRuleForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.channel = channel;
    this.retries = retries;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalBidRuleForecastStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalBidRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional bid rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round(this.retries * this.quantity * 100) / 100;
  }

  copy(): RegionalBidRuleForecast {
    return new RegionalBidRuleForecast(
      this.code,
      this.label,
      this.quantity,
      this.channel,
      this.retries,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional bid rule forecast in status open. */
export function newRegionalBidRuleForecast(code: string, label: string): RegionalBidRuleForecast {
  return new RegionalBidRuleForecast(code, label, 0, "", 0, 0, "open");
}
