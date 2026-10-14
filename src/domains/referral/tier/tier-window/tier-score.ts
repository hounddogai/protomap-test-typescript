import * as text from "../../../../kit/text.js";

/** Where a tier score is in its life cycle. */
export type TierScoreStatus = "created" | "validated" | "published" | "retired";

/** A tier score as the tier team keeps it. */
export class TierScore {
  code: string;
  name: string;
  pinned: boolean;
  startsAt: number;
  cohort: string;
  status: TierScoreStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    startsAt: number,
    cohort: string,
    status: TierScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.startsAt = startsAt;
    this.cohort = cohort;
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

  canMoveTo(next: TierScoreStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TierScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): TierScore {
    return new TierScore(this.code, this.name, this.pinned, this.startsAt, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tier score in status created. */
export function newTierScore(code: string, name: string): TierScore {
  return new TierScore(code, name, false, 0, "", "created");
}
