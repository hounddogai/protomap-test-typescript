import * as text from "../../../../kit/text.js";

/** Where a weighted proof metric is in its life cycle. */
export type WeightedProofMetricStatus = "created" | "validated" | "published" | "retired";

/** A weighted proof metric as the proof team keeps it. */
export class WeightedProofMetric {
  code: string;
  name: string;
  channel: string;
  batchSize: number;
  cohort: string;
  minimum: number;
  budget: number;
  variant: string;
  timezone: string;
  segment: string;
  externalRef: string;
  status: WeightedProofMetricStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    batchSize: number,
    cohort: string,
    minimum: number,
    budget: number,
    variant: string,
    timezone: string,
    segment: string,
    externalRef: string,
    status: WeightedProofMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.minimum = minimum;
    this.budget = budget;
    this.variant = variant;
    this.timezone = timezone;
    this.segment = segment;
    this.externalRef = externalRef;
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

  canMoveTo(next: WeightedProofMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedProofMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.batchSize - this.budget) * 100) / 100;
  }

  copy(): WeightedProofMetric {
    return new WeightedProofMetric(
      this.code,
      this.name,
      this.channel,
      this.batchSize,
      this.cohort,
      this.minimum,
      this.budget,
      this.variant,
      this.timezone,
      this.segment,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted proof metric in status created. */
export function newWeightedProofMetric(code: string, name: string): WeightedProofMetric {
  return new WeightedProofMetric(code, name, "", 0, "", 0, 0, "", "", "", "", "created");
}
