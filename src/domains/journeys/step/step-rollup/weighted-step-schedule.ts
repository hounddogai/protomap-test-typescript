import * as text from "../../../../kit/text.js";

/** Where a weighted step schedule is in its life cycle. */
export type WeightedStepScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted step schedule as the step team keeps it. */
export class WeightedStepSchedule {
  code: string;
  title: string;
  revision: number;
  graceDays: number;
  currency: string;
  ceiling: number;
  source: string;
  attributes: Map<string, string>;
  name: string;
  status: WeightedStepScheduleStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    graceDays: number,
    currency: string,
    ceiling: number,
    source: string,
    attributes: Map<string, string>,
    name: string,
    status: WeightedStepScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.graceDays = graceDays;
    this.currency = currency;
    this.ceiling = ceiling;
    this.source = source;
    this.attributes = attributes;
    this.name = name;
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

  canMoveTo(next: WeightedStepScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedStepScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted step schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.revision * this.ceiling * 100) / 100;
  }

  copy(): WeightedStepSchedule {
    return new WeightedStepSchedule(
      this.code,
      this.title,
      this.revision,
      this.graceDays,
      this.currency,
      this.ceiling,
      this.source,
      this.attributes,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted step schedule in status requested. */
export function newWeightedStepSchedule(code: string, title: string): WeightedStepSchedule {
  return new WeightedStepSchedule(code, title, 0, 0, "", 0, "", new Map<string, string>(), "", "requested");
}
