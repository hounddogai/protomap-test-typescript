import * as text from "../../../../kit/text.js";

/** Where a tiered flight exception is in its life cycle. */
export type TieredFlightExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered flight exception, with what the planners need to act on it. */
export class TieredFlightException {
  code: string;
  title: string;
  category: string;
  durationMinutes: number;
  cost: number;
  priority: number;
  version: number;
  archived: boolean;
  limit: number;
  score: number;
  startsAt: number;
  status: TieredFlightExceptionStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    durationMinutes: number,
    cost: number,
    priority: number,
    version: number,
    archived: boolean,
    limit: number,
    score: number,
    startsAt: number,
    status: TieredFlightExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.priority = priority;
    this.version = version;
    this.archived = archived;
    this.limit = limit;
    this.score = score;
    this.startsAt = startsAt;
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

  canMoveTo(next: TieredFlightExceptionStatus): boolean {
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
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredFlightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered flight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"tiered flight exception"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.limit - this.cost) * 100) / 100;
  }

  copy(): TieredFlightException {
    return new TieredFlightException(
      this.code,
      this.title,
      this.category,
      this.durationMinutes,
      this.cost,
      this.priority,
      this.version,
      this.archived,
      this.limit,
      this.score,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered flight exception in status new. */
export function newTieredFlightException(code: string, title: string): TieredFlightException {
  return new TieredFlightException(code, title, "", 0, 0, 0, 0, false, 0, 0, 0, "new");
}
