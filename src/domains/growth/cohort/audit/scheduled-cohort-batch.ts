import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort batch is in its life cycle. */
export type ScheduledCohortBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled cohort batch as the cohort team keeps it. */
export class ScheduledCohortBatch {
  code: string;
  name: string;
  timezone: string;
  phone: string;
  bid: number;
  weight: number;
  attributes: Map<string, string>;
  source: string;
  status: ScheduledCohortBatchStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    phone: string,
    bid: number,
    weight: number,
    attributes: Map<string, string>,
    source: string,
    status: ScheduledCohortBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.phone = phone;
    this.bid = bid;
    this.weight = weight;
    this.attributes = attributes;
    this.source = source;
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

  canMoveTo(next: ScheduledCohortBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledCohortBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.weight + this.bid) * 100) / 100;
  }

  copy(): ScheduledCohortBatch {
    return new ScheduledCohortBatch(
      this.code,
      this.name,
      this.timezone,
      this.phone,
      this.bid,
      this.weight,
      this.attributes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled cohort batch in status new. */
export function newScheduledCohortBatch(code: string, name: string): ScheduledCohortBatch {
  return new ScheduledCohortBatch(code, name, "", "", 0, 0, new Map<string, string>(), "", "new");
}
