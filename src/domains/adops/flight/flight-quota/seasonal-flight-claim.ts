import * as text from "../../../../kit/text.js";

/** Where a seasonal flight claim is in its life cycle. */
export type SeasonalFlightClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal flight claim, with what the planners need to act on it. */
export class SeasonalFlightClaim {
  code: string;
  title: string;
  openRate: number;
  timezone: string;
  budget: number;
  locale: string;
  quantity: number;
  status: SeasonalFlightClaimStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    timezone: string,
    budget: number,
    locale: string,
    quantity: number,
    status: SeasonalFlightClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.timezone = timezone;
    this.budget = budget;
    this.locale = locale;
    this.quantity = quantity;
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

  canMoveTo(next: SeasonalFlightClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFlightClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal flight claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round((this.budget + this.quantity) * 100) / 100;
  }

  copy(): SeasonalFlightClaim {
    return new SeasonalFlightClaim(
      this.code,
      this.title,
      this.openRate,
      this.timezone,
      this.budget,
      this.locale,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal flight claim in status idle. */
export function newSeasonalFlightClaim(code: string, title: string): SeasonalFlightClaim {
  return new SeasonalFlightClaim(code, title, 0, "", 0, "", 0, "idle");
}
