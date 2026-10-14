import * as text from "../../../../kit/text.js";

/** Where a double opt in metric is in its life cycle. */
export type DoubleOptInMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a double opt in metric and its current status. */
export class DoubleOptInMetric {
  code: string;
  title: string;
  threshold: number;
  visible: boolean;
  attempts: number;
  region: string;
  ceiling: number;
  status: DoubleOptInMetricStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    visible: boolean,
    attempts: number,
    region: string,
    ceiling: number,
    status: DoubleOptInMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.visible = visible;
    this.attempts = attempts;
    this.region = region;
    this.ceiling = ceiling;
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

  canMoveTo(next: DoubleOptInMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.ceiling * this.threshold * 100) / 100;
  }

  copy(): DoubleOptInMetric {
    return new DoubleOptInMetric(
      this.code,
      this.title,
      this.threshold,
      this.visible,
      this.attempts,
      this.region,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a double opt in metric in status draft. */
export function newDoubleOptInMetric(code: string, title: string): DoubleOptInMetric {
  return new DoubleOptInMetric(code, title, 0, false, 0, "", 0, "draft");
}
