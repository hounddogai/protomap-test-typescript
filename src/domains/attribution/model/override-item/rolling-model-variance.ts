import * as text from "../../../../kit/text.js";

/** Where a rolling model variance is in its life cycle. */
export type RollingModelVarianceStatus = "created" | "validated" | "published" | "retired";

/** One rolling model variance, with what the planners need to act on it. */
export class RollingModelVariance {
  code: string;
  name: string;
  category: string;
  externalRef: string;
  country: string;
  cohort: string;
  ratio: number;
  expiresAt: number;
  revision: number;
  budget: number;
  startsAt: number;
  status: RollingModelVarianceStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    externalRef: string,
    country: string,
    cohort: string,
    ratio: number,
    expiresAt: number,
    revision: number,
    budget: number,
    startsAt: number,
    status: RollingModelVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.externalRef = externalRef;
    this.country = country;
    this.cohort = cohort;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.budget = budget;
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

  canMoveTo(next: RollingModelVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingModelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling model variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"rolling model variance"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt - this.budget) * 100) / 100;
  }

  copy(): RollingModelVariance {
    return new RollingModelVariance(
      this.code,
      this.name,
      this.category,
      this.externalRef,
      this.country,
      this.cohort,
      this.ratio,
      this.expiresAt,
      this.revision,
      this.budget,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling model variance in status created. */
export function newRollingModelVariance(code: string, name: string): RollingModelVariance {
  return new RollingModelVariance(code, name, "", "", "", "", 0, 0, 0, 0, 0, "created");
}
