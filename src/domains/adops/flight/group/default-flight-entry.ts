import * as text from "../../../../kit/text.js";

/** Where a default flight entry is in its life cycle. */
export type DefaultFlightEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default flight entry as the flight team keeps it. */
export class DefaultFlightEntry {
  code: string;
  title: string;
  createdAt: number;
  region: string;
  segment: string;
  audienceId: string;
  locale: string;
  source: string;
  ownerId: string;
  revision: number;
  limit: number;
  status: DefaultFlightEntryStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    region: string,
    segment: string,
    audienceId: string,
    locale: string,
    source: string,
    ownerId: string,
    revision: number,
    limit: number,
    status: DefaultFlightEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.region = region;
    this.segment = segment;
    this.audienceId = audienceId;
    this.locale = locale;
    this.source = source;
    this.ownerId = ownerId;
    this.revision = revision;
    this.limit = limit;
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

  canMoveTo(next: DefaultFlightEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultFlightEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default flight entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"default flight entry"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.limit + this.revision) * 100) / 100;
  }

  copy(): DefaultFlightEntry {
    return new DefaultFlightEntry(
      this.code,
      this.title,
      this.createdAt,
      this.region,
      this.segment,
      this.audienceId,
      this.locale,
      this.source,
      this.ownerId,
      this.revision,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default flight entry in status open. */
export function newDefaultFlightEntry(code: string, title: string): DefaultFlightEntry {
  return new DefaultFlightEntry(code, title, 0, "", "", "", "", "", "", 0, 0, "open");
}
