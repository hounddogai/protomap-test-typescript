import * as text from "../../../../kit/text.js";

/** Where a adaptive enrollment baseline is in its life cycle. */
export type AdaptiveEnrollmentBaselineStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive enrollment baseline. Its code is unique within a tenant. */
export class AdaptiveEnrollmentBaseline {
  code: string;
  name: string;
  unit: string;
  impressions: number;
  version: number;
  summary: string;
  country: string;
  conversionRate: number;
  segment: string;
  status: AdaptiveEnrollmentBaselineStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    impressions: number,
    version: number,
    summary: string,
    country: string,
    conversionRate: number,
    segment: string,
    status: AdaptiveEnrollmentBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.impressions = impressions;
    this.version = version;
    this.summary = summary;
    this.country = country;
    this.conversionRate = conversionRate;
    this.segment = segment;
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

  canMoveTo(next: AdaptiveEnrollmentBaselineStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveEnrollmentBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive enrollment baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"adaptive enrollment baseline"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate + this.version) * 100) / 100;
  }

  copy(): AdaptiveEnrollmentBaseline {
    return new AdaptiveEnrollmentBaseline(
      this.code,
      this.name,
      this.unit,
      this.impressions,
      this.version,
      this.summary,
      this.country,
      this.conversionRate,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive enrollment baseline in status draft. */
export function newAdaptiveEnrollmentBaseline(code: string, name: string): AdaptiveEnrollmentBaseline {
  return new AdaptiveEnrollmentBaseline(code, name, "", 0, 0, "", "", 0, "", "draft");
}
