import * as text from "../../../../kit/text.js";

/** Where a cohort forecast is in its life cycle. */
export type CohortForecastStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a cohort forecast and its current status. */
export class CohortForecast {
  code: string;
  name: string;
  tags: string[];
  budget: number;
  region: string;
  durationMinutes: number;
  score: number;
  checksum: string;
  approved: boolean;
  status: CohortForecastStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    budget: number,
    region: string,
    durationMinutes: number,
    score: number,
    checksum: string,
    approved: boolean,
    status: CohortForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.budget = budget;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.score = score;
    this.checksum = checksum;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortForecastStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"cohort forecast"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.budget + this.durationMinutes) * 100) / 100;
  }

  copy(): CohortForecast {
    return new CohortForecast(
      this.code,
      this.name,
      this.tags,
      this.budget,
      this.region,
      this.durationMinutes,
      this.score,
      this.checksum,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a cohort forecast in status requested. */
export function newCohortForecast(code: string, name: string): CohortForecast {
  return new CohortForecast(code, name, [], 0, "", 0, 0, "", false, "requested");
}
