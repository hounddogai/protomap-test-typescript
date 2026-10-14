import * as text from "../../../../kit/text.js";

/** Where a activation metric is in its life cycle. */
export type ActivationMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** One activation metric, with what the planners need to act on it. */
export class ActivationMetric {
  code: string;
  name: string;
  currency: string;
  ownerId: string;
  ratio: number;
  threshold: number;
  region: string;
  version: number;
  revision: number;
  category: string;
  status: ActivationMetricStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    ownerId: string,
    ratio: number,
    threshold: number,
    region: string,
    version: number,
    revision: number,
    category: string,
    status: ActivationMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.ownerId = ownerId;
    this.ratio = ratio;
    this.threshold = threshold;
    this.region = region;
    this.version = version;
    this.revision = revision;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.version - this.ratio) * 100) / 100;
  }

  copy(): ActivationMetric {
    return new ActivationMetric(
      this.code,
      this.name,
      this.currency,
      this.ownerId,
      this.ratio,
      this.threshold,
      this.region,
      this.version,
      this.revision,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a activation metric in status new. */
export function newActivationMetric(code: string, name: string): ActivationMetric {
  return new ActivationMetric(code, name, "", "", 0, 0, "", 0, 0, "", "new");
}
