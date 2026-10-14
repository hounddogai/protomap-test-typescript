import * as text from "../../../../kit/text.js";

/** Where a legacy conversion metric is in its life cycle. */
export type LegacyConversionMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy conversion metric, with what the planners need to act on it. */
export class LegacyConversionMetric {
  code: string;
  title: string;
  frequencyCap: number;
  quantity: number;
  country: string;
  archived: boolean;
  campaignRef: string;
  summary: string;
  checksum: string;
  capacity: number;
  status: LegacyConversionMetricStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    quantity: number,
    country: string,
    archived: boolean,
    campaignRef: string,
    summary: string,
    checksum: string,
    capacity: number,
    status: LegacyConversionMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.country = country;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.checksum = checksum;
    this.capacity = capacity;
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

  canMoveTo(next: LegacyConversionMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyConversionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy conversion metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity + this.quantity) * 100) / 100;
  }

  copy(): LegacyConversionMetric {
    return new LegacyConversionMetric(
      this.code,
      this.title,
      this.frequencyCap,
      this.quantity,
      this.country,
      this.archived,
      this.campaignRef,
      this.summary,
      this.checksum,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy conversion metric in status proposed. */
export function newLegacyConversionMetric(code: string, title: string): LegacyConversionMetric {
  return new LegacyConversionMetric(code, title, 0, 0, "", false, "", "", "", 0, "proposed");
}
