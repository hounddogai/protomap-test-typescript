import * as text from "../../../../kit/text.js";

/** Where a cohort adjustment is in its life cycle. */
export type CohortAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One cohort adjustment, with what the planners need to act on it. */
export class CohortAdjustment {
  code: string;
  name: string;
  revision: number;
  openRate: number;
  country: string;
  version: number;
  status: CohortAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    openRate: number,
    country: string,
    version: number,
    status: CohortAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.openRate = openRate;
    this.country = country;
    this.version = version;
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

  canMoveTo(next: CohortAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"cohort adjustment"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.version * this.revision * 100) / 100;
  }

  copy(): CohortAdjustment {
    return new CohortAdjustment(
      this.code,
      this.name,
      this.revision,
      this.openRate,
      this.country,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a cohort adjustment in status new. */
export function newCohortAdjustment(code: string, name: string): CohortAdjustment {
  return new CohortAdjustment(code, name, 0, 0, "", 0, "new");
}
