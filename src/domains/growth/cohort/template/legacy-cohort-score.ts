import * as text from "../../../../kit/text.js";

/** Where a legacy cohort score is in its life cycle. */
export type LegacyCohortScoreStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy cohort score and its current status. */
export class LegacyCohortScore {
  code: string;
  name: string;
  retries: number;
  approved: boolean;
  region: string;
  windowDays: number;
  status: LegacyCohortScoreStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    approved: boolean,
    region: string,
    windowDays: number,
    status: LegacyCohortScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.approved = approved;
    this.region = region;
    this.windowDays = windowDays;
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

  canMoveTo(next: LegacyCohortScoreStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCohortScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy cohort score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.retries + this.windowDays) * 100) / 100;
  }

  copy(): LegacyCohortScore {
    return new LegacyCohortScore(
      this.code,
      this.name,
      this.retries,
      this.approved,
      this.region,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy cohort score in status created. */
export function newLegacyCohortScore(code: string, name: string): LegacyCohortScore {
  return new LegacyCohortScore(code, name, 0, false, "", 0, "created");
}
