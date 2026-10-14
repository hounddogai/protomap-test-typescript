import * as text from "../../../../kit/text.js";

/** Where a conversion metric is in its life cycle. */
export type ConversionMetricStatus = "created" | "validated" | "published" | "retired";

/** A conversion metric. Its code is unique within a tenant. */
export class ConversionMetric {
  code: string;
  label: string;
  revision: number;
  description: string;
  retries: number;
  conversionRate: number;
  phone: string;
  status: ConversionMetricStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    description: string,
    retries: number,
    conversionRate: number,
    phone: string,
    status: ConversionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.description = description;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.phone = phone;
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

  canMoveTo(next: ConversionMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"conversion metric"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.revision * this.retries * 100) / 100;
  }

  copy(): ConversionMetric {
    return new ConversionMetric(
      this.code,
      this.label,
      this.revision,
      this.description,
      this.retries,
      this.conversionRate,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion metric in status created. */
export function newConversionMetric(code: string, label: string): ConversionMetric {
  return new ConversionMetric(code, label, 0, "", 0, 0, "", "created");
}
