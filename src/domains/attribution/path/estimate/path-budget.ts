import * as text from "../../../../kit/text.js";

/** Where a path budget is in its life cycle. */
export type PathBudgetStatus = "created" | "validated" | "published" | "retired";

/** The record of a path budget and its current status. */
export class PathBudget {
  code: string;
  title: string;
  description: string;
  maximum: number;
  audienceId: string;
  retries: number;
  timezone: string;
  source: string;
  bid: number;
  startsAt: number;
  status: PathBudgetStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    maximum: number,
    audienceId: string,
    retries: number,
    timezone: string,
    source: string,
    bid: number,
    startsAt: number,
    status: PathBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.retries = retries;
    this.timezone = timezone;
    this.source = source;
    this.bid = bid;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathBudgetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.startsAt + this.bid) * 100) / 100;
  }

  copy(): PathBudget {
    return new PathBudget(
      this.code,
      this.title,
      this.description,
      this.maximum,
      this.audienceId,
      this.retries,
      this.timezone,
      this.source,
      this.bid,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a path budget in status created. */
export function newPathBudget(code: string, title: string): PathBudget {
  return new PathBudget(code, title, "", 0, "", 0, "", "", 0, 0, "created");
}
