import * as text from "../../../../kit/text.js";

/** Where a global flight summary is in its life cycle. */
export type GlobalFlightSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One global flight summary, with what the planners need to act on it. */
export class GlobalFlightSummary {
  code: string;
  label: string;
  maximum: number;
  graceDays: number;
  endsAt: number;
  version: number;
  currency: string;
  updatedAt: number;
  revision: number;
  minimum: number;
  name: string;
  status: GlobalFlightSummaryStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    graceDays: number,
    endsAt: number,
    version: number,
    currency: string,
    updatedAt: number,
    revision: number,
    minimum: number,
    name: string,
    status: GlobalFlightSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.endsAt = endsAt;
    this.version = version;
    this.currency = currency;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.minimum = minimum;
    this.name = name;
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

  canMoveTo(next: GlobalFlightSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalFlightSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"global flight summary"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.updatedAt * this.version * 100) / 100;
  }

  copy(): GlobalFlightSummary {
    return new GlobalFlightSummary(
      this.code,
      this.label,
      this.maximum,
      this.graceDays,
      this.endsAt,
      this.version,
      this.currency,
      this.updatedAt,
      this.revision,
      this.minimum,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global flight summary in status planned. */
export function newGlobalFlightSummary(code: string, label: string): GlobalFlightSummary {
  return new GlobalFlightSummary(code, label, 0, 0, 0, 0, "", 0, 0, 0, "", "planned");
}
