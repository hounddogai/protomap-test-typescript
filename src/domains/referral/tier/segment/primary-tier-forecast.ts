import * as text from "../../../../kit/text.js";

/** Where a primary tier forecast is in its life cycle. */
export type PrimaryTierForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary tier forecast. Its code is unique within a tenant. */
export class PrimaryTierForecast {
  code: string;
  name: string;
  budget: number;
  sequence: number;
  sendAt: number;
  timezone: string;
  amount: number;
  utmSource: string;
  status: PrimaryTierForecastStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    sequence: number,
    sendAt: number,
    timezone: string,
    amount: number,
    utmSource: string,
    status: PrimaryTierForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.sequence = sequence;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.amount = amount;
    this.utmSource = utmSource;
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

  canMoveTo(next: PrimaryTierForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryTierForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.sequence) * 100) / 100;
  }

  copy(): PrimaryTierForecast {
    return new PrimaryTierForecast(
      this.code,
      this.name,
      this.budget,
      this.sequence,
      this.sendAt,
      this.timezone,
      this.amount,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary tier forecast in status draft. */
export function newPrimaryTierForecast(code: string, name: string): PrimaryTierForecast {
  return new PrimaryTierForecast(code, name, 0, 0, 0, "", 0, "", "draft");
}
