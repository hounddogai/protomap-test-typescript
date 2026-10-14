import * as text from "../../../../kit/text.js";

/** Where a scheduled pacing rollup is in its life cycle. */
export type ScheduledPacingRollupStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled pacing rollup and its current status. */
export class ScheduledPacingRollup {
  code: string;
  title: string;
  expiresAt: number;
  updatedAt: number;
  graceDays: number;
  weight: number;
  bid: number;
  endsAt: number;
  status: ScheduledPacingRollupStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    updatedAt: number,
    graceDays: number,
    weight: number,
    bid: number,
    endsAt: number,
    status: ScheduledPacingRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.graceDays = graceDays;
    this.weight = weight;
    this.bid = bid;
    this.endsAt = endsAt;
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

  canMoveTo(next: ScheduledPacingRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPacingRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled pacing rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled pacing rollup"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.updatedAt - this.graceDays) * 100) / 100;
  }

  copy(): ScheduledPacingRollup {
    return new ScheduledPacingRollup(
      this.code,
      this.title,
      this.expiresAt,
      this.updatedAt,
      this.graceDays,
      this.weight,
      this.bid,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled pacing rollup in status created. */
export function newScheduledPacingRollup(code: string, title: string): ScheduledPacingRollup {
  return new ScheduledPacingRollup(code, title, 0, 0, 0, 0, 0, 0, "created");
}
