import * as text from "../../../../kit/text.js";

/** Where a default conversion metric is in its life cycle. */
export type DefaultConversionMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a default conversion metric and its current status. */
export class DefaultConversionMetric {
  code: string;
  label: string;
  contactEmail: string;
  limit: number;
  description: string;
  impressions: number;
  campaignRef: string;
  name: string;
  status: DefaultConversionMetricStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    limit: number,
    description: string,
    impressions: number,
    campaignRef: string,
    name: string,
    status: DefaultConversionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.description = description;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultConversionMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultConversionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default conversion metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.limit * this.impressions * 100) / 100;
  }

  copy(): DefaultConversionMetric {
    return new DefaultConversionMetric(
      this.code,
      this.label,
      this.contactEmail,
      this.limit,
      this.description,
      this.impressions,
      this.campaignRef,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default conversion metric in status created. */
export function newDefaultConversionMetric(code: string, label: string): DefaultConversionMetric {
  return new DefaultConversionMetric(code, label, "", 0, "", 0, "", "", "created");
}
