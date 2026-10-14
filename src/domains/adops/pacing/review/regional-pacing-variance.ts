import * as text from "../../../../kit/text.js";

/** Where a regional pacing variance is in its life cycle. */
export type RegionalPacingVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional pacing variance. Its code is unique within a tenant. */
export class RegionalPacingVariance {
  code: string;
  title: string;
  sequence: number;
  impressions: number;
  approved: boolean;
  locale: string;
  startsAt: number;
  maximum: number;
  status: RegionalPacingVarianceStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    impressions: number,
    approved: boolean,
    locale: string,
    startsAt: number,
    maximum: number,
    status: RegionalPacingVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.impressions = impressions;
    this.approved = approved;
    this.locale = locale;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPacingVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalPacingVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional pacing variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.impressions * this.maximum * 100) / 100;
  }

  copy(): RegionalPacingVariance {
    return new RegionalPacingVariance(
      this.code,
      this.title,
      this.sequence,
      this.impressions,
      this.approved,
      this.locale,
      this.startsAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional pacing variance in status proposed. */
export function newRegionalPacingVariance(code: string, title: string): RegionalPacingVariance {
  return new RegionalPacingVariance(code, title, 0, 0, false, "", 0, 0, "proposed");
}
