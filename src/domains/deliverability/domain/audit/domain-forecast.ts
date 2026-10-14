import * as text from "../../../../kit/text.js";

/** Where a domain forecast is in its life cycle. */
export type DomainForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A domain forecast. Its code is unique within a tenant. */
export class DomainForecast {
  code: string;
  label: string;
  impressions: number;
  archived: boolean;
  region: string;
  checksum: string;
  contactEmail: string;
  limit: number;
  weight: number;
  status: DomainForecastStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    archived: boolean,
    region: string,
    checksum: string,
    contactEmail: string,
    limit: number,
    weight: number,
    status: DomainForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.archived = archived;
    this.region = region;
    this.checksum = checksum;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.weight = weight;
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

  canMoveTo(next: DomainForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
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
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DomainForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"domain forecast"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.weight + this.limit) * 100) / 100;
  }

  copy(): DomainForecast {
    return new DomainForecast(
      this.code,
      this.label,
      this.impressions,
      this.archived,
      this.region,
      this.checksum,
      this.contactEmail,
      this.limit,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a domain forecast in status draft. */
export function newDomainForecast(code: string, label: string): DomainForecast {
  return new DomainForecast(code, label, 0, false, "", "", "", 0, 0, "draft");
}
