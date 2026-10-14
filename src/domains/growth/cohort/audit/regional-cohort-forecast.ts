import * as text from "../../../../kit/text.js";

/** Where a regional cohort forecast is in its life cycle. */
export type RegionalCohortForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional cohort forecast. Its code is unique within a tenant. */
export class RegionalCohortForecast {
  code: string;
  name: string;
  discount: number;
  threshold: number;
  contactEmail: string;
  phone: string;
  checksum: string;
  currency: string;
  locale: string;
  status: RegionalCohortForecastStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    threshold: number,
    contactEmail: string,
    phone: string,
    checksum: string,
    currency: string,
    locale: string,
    status: RegionalCohortForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.checksum = checksum;
    this.currency = currency;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCohortForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCohortForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional cohort forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round(this.discount * this.threshold * 100) / 100;
  }

  copy(): RegionalCohortForecast {
    return new RegionalCohortForecast(
      this.code,
      this.name,
      this.discount,
      this.threshold,
      this.contactEmail,
      this.phone,
      this.checksum,
      this.currency,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional cohort forecast in status requested. */
export function newRegionalCohortForecast(code: string, name: string): RegionalCohortForecast {
  return new RegionalCohortForecast(code, name, 0, 0, "", "", "", "", "", "requested");
}
