import * as text from "../../../../kit/text.js";

/** Where a lenient conversion metric is in its life cycle. */
export type LenientConversionMetricStatus = "created" | "validated" | "published" | "retired";

/** One lenient conversion metric, with what the planners need to act on it. */
export class LenientConversionMetric {
  code: string;
  name: string;
  priority: number;
  sequence: number;
  limit: number;
  windowDays: number;
  weight: number;
  currency: string;
  channel: string;
  status: LenientConversionMetricStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    sequence: number,
    limit: number,
    windowDays: number,
    weight: number,
    currency: string,
    channel: string,
    status: LenientConversionMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.sequence = sequence;
    this.limit = limit;
    this.windowDays = windowDays;
    this.weight = weight;
    this.currency = currency;
    this.channel = channel;
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

  canMoveTo(next: LenientConversionMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientConversionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round(this.limit * this.weight * 100) / 100;
  }

  copy(): LenientConversionMetric {
    return new LenientConversionMetric(
      this.code,
      this.name,
      this.priority,
      this.sequence,
      this.limit,
      this.windowDays,
      this.weight,
      this.currency,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient conversion metric in status created. */
export function newLenientConversionMetric(code: string, name: string): LenientConversionMetric {
  return new LenientConversionMetric(code, name, 0, 0, 0, 0, 0, "", "", "created");
}
