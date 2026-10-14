import * as text from "../../../../kit/text.js";

/** Where a rolling journey summary is in its life cycle. */
export type RollingJourneySummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling journey summary and its current status. */
export class RollingJourneySummary {
  code: string;
  name: string;
  timezone: string;
  phone: string;
  priority: number;
  notes: string;
  category: string;
  status: RollingJourneySummaryStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    phone: string,
    priority: number,
    notes: string,
    category: string,
    status: RollingJourneySummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.phone = phone;
    this.priority = priority;
    this.notes = notes;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingJourneySummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling journey summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): RollingJourneySummary {
    return new RollingJourneySummary(
      this.code,
      this.name,
      this.timezone,
      this.phone,
      this.priority,
      this.notes,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling journey summary in status open. */
export function newRollingJourneySummary(code: string, name: string): RollingJourneySummary {
  return new RollingJourneySummary(code, name, "", "", 0, "", "", "open");
}
