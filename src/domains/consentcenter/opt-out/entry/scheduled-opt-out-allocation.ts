import * as text from "../../../../kit/text.js";

/** Where a scheduled opt out allocation is in its life cycle. */
export type ScheduledOptOutAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled opt out allocation. Its code is unique within a tenant. */
export class ScheduledOptOutAllocation {
  code: string;
  title: string;
  limit: number;
  weight: number;
  locale: string;
  minimum: number;
  budget: number;
  endsAt: number;
  floorValue: number;
  clicks: number;
  status: ScheduledOptOutAllocationStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    weight: number,
    locale: string,
    minimum: number,
    budget: number,
    endsAt: number,
    floorValue: number,
    clicks: number,
    status: ScheduledOptOutAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.weight = weight;
    this.locale = locale;
    this.minimum = minimum;
    this.budget = budget;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledOptOutAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
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

  moveTo(next: ScheduledOptOutAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled opt out allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.clicks - this.weight) * 100) / 100;
  }

  copy(): ScheduledOptOutAllocation {
    return new ScheduledOptOutAllocation(
      this.code,
      this.title,
      this.limit,
      this.weight,
      this.locale,
      this.minimum,
      this.budget,
      this.endsAt,
      this.floorValue,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled opt out allocation in status new. */
export function newScheduledOptOutAllocation(code: string, title: string): ScheduledOptOutAllocation {
  return new ScheduledOptOutAllocation(code, title, 0, 0, "", 0, 0, 0, 0, 0, "new");
}
