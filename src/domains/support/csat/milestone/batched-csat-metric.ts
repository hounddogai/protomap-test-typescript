import * as text from "../../../../kit/text.js";

/** Where a batched csat metric is in its life cycle. */
export type BatchedCsatMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched csat metric, with what the planners need to act on it. */
export class BatchedCsatMetric {
  code: string;
  title: string;
  currency: string;
  discount: number;
  country: string;
  audienceId: string;
  status: BatchedCsatMetricStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    discount: number,
    country: string,
    audienceId: string,
    status: BatchedCsatMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.discount = discount;
    this.country = country;
    this.audienceId = audienceId;
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

  canMoveTo(next: BatchedCsatMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
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

  moveTo(next: BatchedCsatMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched csat metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): BatchedCsatMetric {
    return new BatchedCsatMetric(
      this.code,
      this.title,
      this.currency,
      this.discount,
      this.country,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched csat metric in status requested. */
export function newBatchedCsatMetric(code: string, title: string): BatchedCsatMetric {
  return new BatchedCsatMetric(code, title, "", 0, "", "", "requested");
}
