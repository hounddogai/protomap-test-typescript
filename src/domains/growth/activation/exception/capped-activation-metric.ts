import * as text from "../../../../kit/text.js";

/** Where a capped activation metric is in its life cycle. */
export type CappedActivationMetricStatus = "created" | "validated" | "published" | "retired";

/** One capped activation metric, with what the planners need to act on it. */
export class CappedActivationMetric {
  code: string;
  name: string;
  locale: string;
  startsAt: number;
  region: string;
  status: CappedActivationMetricStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    startsAt: number,
    region: string,
    status: CappedActivationMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.startsAt = startsAt;
    this.region = region;
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

  canMoveTo(next: CappedActivationMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedActivationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): CappedActivationMetric {
    return new CappedActivationMetric(this.code, this.name, this.locale, this.startsAt, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped activation metric in status created. */
export function newCappedActivationMetric(code: string, name: string): CappedActivationMetric {
  return new CappedActivationMetric(code, name, "", 0, "", "created");
}
