import * as text from "../../../../kit/text.js";

/** Where a model metric is in its life cycle. */
export type ModelMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A model metric. Its code is unique within a tenant. */
export class ModelMetric {
  code: string;
  label: string;
  windowDays: number;
  weight: number;
  minimum: number;
  variant: string;
  createdAt: number;
  campaignRef: string;
  currency: string;
  segment: string;
  status: ModelMetricStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    weight: number,
    minimum: number,
    variant: string,
    createdAt: number,
    campaignRef: string,
    currency: string,
    segment: string,
    status: ModelMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.weight = weight;
    this.minimum = minimum;
    this.variant = variant;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.currency = currency;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"model metric"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.minimum + this.createdAt) * 100) / 100;
  }

  copy(): ModelMetric {
    return new ModelMetric(
      this.code,
      this.label,
      this.windowDays,
      this.weight,
      this.minimum,
      this.variant,
      this.createdAt,
      this.campaignRef,
      this.currency,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a model metric in status idle. */
export function newModelMetric(code: string, label: string): ModelMetric {
  return new ModelMetric(code, label, 0, 0, 0, "", 0, "", "", "", "idle");
}
