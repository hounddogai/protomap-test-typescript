import * as text from "../../../../kit/text.js";

/** Where a ticket view summary is in its life cycle. */
export type TicketViewSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One ticket view summary, with what the planners need to act on it. */
export class TicketViewSummary {
  code: string;
  title: string;
  category: string;
  budget: number;
  country: string;
  revision: number;
  priority: number;
  minimum: number;
  notes: string;
  startsAt: number;
  locale: string;
  status: TicketViewSummaryStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    budget: number,
    country: string,
    revision: number,
    priority: number,
    minimum: number,
    notes: string,
    startsAt: number,
    locale: string,
    status: TicketViewSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.budget = budget;
    this.country = country;
    this.revision = revision;
    this.priority = priority;
    this.minimum = minimum;
    this.notes = notes;
    this.startsAt = startsAt;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget - this.priority) * 100) / 100;
  }

  copy(): TicketViewSummary {
    return new TicketViewSummary(
      this.code,
      this.title,
      this.category,
      this.budget,
      this.country,
      this.revision,
      this.priority,
      this.minimum,
      this.notes,
      this.startsAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a ticket view summary in status proposed. */
export function newTicketViewSummary(code: string, title: string): TicketViewSummary {
  return new TicketViewSummary(code, title, "", 0, "", 0, 0, 0, "", 0, "", "proposed");
}
