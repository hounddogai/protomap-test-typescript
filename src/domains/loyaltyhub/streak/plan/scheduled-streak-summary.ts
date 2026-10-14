import * as text from "../../../../kit/text.js";

/** Where a scheduled streak summary is in its life cycle. */
export type ScheduledStreakSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled streak summary as the streak team keeps it. */
export class ScheduledStreakSummary {
  code: string;
  name: string;
  title: string;
  limit: number;
  archived: boolean;
  source: string;
  status: ScheduledStreakSummaryStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    limit: number,
    archived: boolean,
    source: string,
    status: ScheduledStreakSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.limit = limit;
    this.archived = archived;
    this.source = source;
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

  canMoveTo(next: ScheduledStreakSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledStreakSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled streak summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): ScheduledStreakSummary {
    return new ScheduledStreakSummary(
      this.code,
      this.name,
      this.title,
      this.limit,
      this.archived,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled streak summary in status draft. */
export function newScheduledStreakSummary(code: string, name: string): ScheduledStreakSummary {
  return new ScheduledStreakSummary(code, name, "", 0, false, "", "draft");
}
