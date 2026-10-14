import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup threshold is in its life cycle. */
export type ScheduledWarmupThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled warmup threshold as the warmup team keeps it. */
export class ScheduledWarmupThreshold {
  code: string;
  title: string;
  revision: number;
  cost: number;
  margin: number;
  batchSize: number;
  variant: string;
  retries: number;
  attributes: Map<string, string>;
  description: string;
  status: ScheduledWarmupThresholdStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    cost: number,
    margin: number,
    batchSize: number,
    variant: string,
    retries: number,
    attributes: Map<string, string>,
    description: string,
    status: ScheduledWarmupThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.cost = cost;
    this.margin = margin;
    this.batchSize = batchSize;
    this.variant = variant;
    this.retries = retries;
    this.attributes = attributes;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWarmupThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledWarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.batchSize + this.margin) * 100) / 100;
  }

  copy(): ScheduledWarmupThreshold {
    return new ScheduledWarmupThreshold(
      this.code,
      this.title,
      this.revision,
      this.cost,
      this.margin,
      this.batchSize,
      this.variant,
      this.retries,
      this.attributes,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled warmup threshold in status planned. */
export function newScheduledWarmupThreshold(code: string, title: string): ScheduledWarmupThreshold {
  return new ScheduledWarmupThreshold(code, title, 0, 0, 0, 0, "", 0, new Map<string, string>(), "", "planned");
}
