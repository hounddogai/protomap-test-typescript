import * as text from "../../../../kit/text.js";

/** Where a path summary is in its life cycle. */
export type PathSummaryStatus = "created" | "validated" | "published" | "retired";

/** One path summary, with what the planners need to act on it. */
export class PathSummary {
  code: string;
  label: string;
  cost: number;
  weight: number;
  active: boolean;
  expiresAt: number;
  ratio: number;
  externalRef: string;
  cohort: string;
  timezone: string;
  status: PathSummaryStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    weight: number,
    active: boolean,
    expiresAt: number,
    ratio: number,
    externalRef: string,
    cohort: string,
    timezone: string,
    status: PathSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.weight = weight;
    this.active = active;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.timezone = timezone;
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

  canMoveTo(next: PathSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
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

  moveTo(next: PathSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.ratio * this.weight * 100) / 100;
  }

  copy(): PathSummary {
    return new PathSummary(
      this.code,
      this.label,
      this.cost,
      this.weight,
      this.active,
      this.expiresAt,
      this.ratio,
      this.externalRef,
      this.cohort,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a path summary in status created. */
export function newPathSummary(code: string, label: string): PathSummary {
  return new PathSummary(code, label, 0, 0, false, 0, 0, "", "", "", "created");
}
