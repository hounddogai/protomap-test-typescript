import * as text from "../../../../kit/text.js";

/** Where a deflection forecast is in its life cycle. */
export type DeflectionForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A deflection forecast as the deflection team keeps it. */
export class DeflectionForecast {
  code: string;
  name: string;
  category: string;
  externalRef: string;
  variant: string;
  conversionRate: number;
  archived: boolean;
  ownerId: string;
  status: DeflectionForecastStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    externalRef: string,
    variant: string,
    conversionRate: number,
    archived: boolean,
    ownerId: string,
    status: DeflectionForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.externalRef = externalRef;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.ownerId = ownerId;
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

  canMoveTo(next: DeflectionForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: DeflectionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection forecast"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): DeflectionForecast {
    return new DeflectionForecast(
      this.code,
      this.name,
      this.category,
      this.externalRef,
      this.variant,
      this.conversionRate,
      this.archived,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a deflection forecast in status draft. */
export function newDeflectionForecast(code: string, name: string): DeflectionForecast {
  return new DeflectionForecast(code, name, "", "", "", 0, false, "", "draft");
}
