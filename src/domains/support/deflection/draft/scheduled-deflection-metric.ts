import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection metric is in its life cycle. */
export type ScheduledDeflectionMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled deflection metric and its current status. */
export class ScheduledDeflectionMetric {
  code: string;
  label: string;
  audienceId: string;
  capacity: number;
  ratio: number;
  endsAt: number;
  priority: number;
  attributes: Map<string, string>;
  currency: string;
  status: ScheduledDeflectionMetricStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    capacity: number,
    ratio: number,
    endsAt: number,
    priority: number,
    attributes: Map<string, string>,
    currency: string,
    status: ScheduledDeflectionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.priority = priority;
    this.attributes = attributes;
    this.currency = currency;
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

  canMoveTo(next: ScheduledDeflectionMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.ratio + this.endsAt) * 100) / 100;
  }

  copy(): ScheduledDeflectionMetric {
    return new ScheduledDeflectionMetric(
      this.code,
      this.label,
      this.audienceId,
      this.capacity,
      this.ratio,
      this.endsAt,
      this.priority,
      this.attributes,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled deflection metric in status created. */
export function newScheduledDeflectionMetric(code: string, label: string): ScheduledDeflectionMetric {
  return new ScheduledDeflectionMetric(code, label, "", 0, 0, 0, 0, new Map<string, string>(), "", "created");
}
