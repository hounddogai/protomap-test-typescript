import * as text from "../../../../kit/text.js";

/** Where a scheduled path forecast is in its life cycle. */
export type ScheduledPathForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled path forecast. Its code is unique within a tenant. */
export class ScheduledPathForecast {
  code: string;
  title: string;
  pinned: boolean;
  segment: string;
  endsAt: number;
  source: string;
  contactEmail: string;
  status: ScheduledPathForecastStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    segment: string,
    endsAt: number,
    source: string,
    contactEmail: string,
    status: ScheduledPathForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.segment = segment;
    this.endsAt = endsAt;
    this.source = source;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ScheduledPathForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "failed";
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

  moveTo(next: ScheduledPathForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled path forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): ScheduledPathForecast {
    return new ScheduledPathForecast(
      this.code,
      this.title,
      this.pinned,
      this.segment,
      this.endsAt,
      this.source,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled path forecast in status new. */
export function newScheduledPathForecast(code: string, title: string): ScheduledPathForecast {
  return new ScheduledPathForecast(code, title, false, "", 0, "", "", "new");
}
