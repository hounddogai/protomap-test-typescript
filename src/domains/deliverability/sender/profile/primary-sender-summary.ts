import * as text from "../../../../kit/text.js";

/** Where a primary sender summary is in its life cycle. */
export type PrimarySenderSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary sender summary. Its code is unique within a tenant. */
export class PrimarySenderSummary {
  code: string;
  title: string;
  createdAt: number;
  budget: number;
  priority: number;
  ratio: number;
  utmSource: string;
  capacity: number;
  retries: number;
  status: PrimarySenderSummaryStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    budget: number,
    priority: number,
    ratio: number,
    utmSource: string,
    capacity: number,
    retries: number,
    status: PrimarySenderSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.budget = budget;
    this.priority = priority;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.retries = retries;
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

  canMoveTo(next: PrimarySenderSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimarySenderSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary sender summary"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.retries - this.capacity) * 100) / 100;
  }

  copy(): PrimarySenderSummary {
    return new PrimarySenderSummary(
      this.code,
      this.title,
      this.createdAt,
      this.budget,
      this.priority,
      this.ratio,
      this.utmSource,
      this.capacity,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary sender summary in status planned. */
export function newPrimarySenderSummary(code: string, title: string): PrimarySenderSummary {
  return new PrimarySenderSummary(code, title, 0, 0, 0, 0, "", 0, 0, "planned");
}
