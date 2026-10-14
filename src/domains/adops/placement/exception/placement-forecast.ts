import * as text from "../../../../kit/text.js";

/** Where a placement forecast is in its life cycle. */
export type PlacementForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a placement forecast and its current status. */
export class PlacementForecast {
  code: string;
  title: string;
  maximum: number;
  utmSource: string;
  phone: string;
  contactEmail: string;
  externalRef: string;
  approved: boolean;
  status: PlacementForecastStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    utmSource: string,
    phone: string,
    contactEmail: string,
    externalRef: string,
    approved: boolean,
    status: PlacementForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.utmSource = utmSource;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.approved = approved;
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

  canMoveTo(next: PlacementForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): PlacementForecast {
    return new PlacementForecast(
      this.code,
      this.title,
      this.maximum,
      this.utmSource,
      this.phone,
      this.contactEmail,
      this.externalRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a placement forecast in status open. */
export function newPlacementForecast(code: string, title: string): PlacementForecast {
  return new PlacementForecast(code, title, 0, "", "", "", "", false, "open");
}
