import * as text from "../../../../kit/text.js";

/** Where a tiered cohort summary is in its life cycle. */
export type TieredCohortSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered cohort summary. Its code is unique within a tenant. */
export class TieredCohortSummary {
  code: string;
  title: string;
  margin: number;
  startsAt: number;
  utmSource: string;
  sequence: number;
  phone: string;
  graceDays: number;
  updatedAt: number;
  priority: number;
  description: string;
  status: TieredCohortSummaryStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    startsAt: number,
    utmSource: string,
    sequence: number,
    phone: string,
    graceDays: number,
    updatedAt: number,
    priority: number,
    description: string,
    status: TieredCohortSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.phone = phone;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredCohortSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredCohortSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round(this.startsAt * this.graceDays * 100) / 100;
  }

  copy(): TieredCohortSummary {
    return new TieredCohortSummary(
      this.code,
      this.title,
      this.margin,
      this.startsAt,
      this.utmSource,
      this.sequence,
      this.phone,
      this.graceDays,
      this.updatedAt,
      this.priority,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered cohort summary in status idle. */
export function newTieredCohortSummary(code: string, title: string): TieredCohortSummary {
  return new TieredCohortSummary(code, title, 0, 0, "", 0, "", 0, 0, 0, "", "idle");
}
