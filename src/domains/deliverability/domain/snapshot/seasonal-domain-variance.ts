import * as text from "../../../../kit/text.js";

/** Where a seasonal domain variance is in its life cycle. */
export type SeasonalDomainVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal domain variance as the domain team keeps it. */
export class SeasonalDomainVariance {
  code: string;
  name: string;
  revision: number;
  reviewer: string;
  region: string;
  status: SeasonalDomainVarianceStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    reviewer: string,
    region: string,
    status: SeasonalDomainVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.reviewer = reviewer;
    this.region = region;
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

  canMoveTo(next: SeasonalDomainVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDomainVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): SeasonalDomainVariance {
    return new SeasonalDomainVariance(this.code, this.name, this.revision, this.reviewer, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal domain variance in status open. */
export function newSeasonalDomainVariance(code: string, name: string): SeasonalDomainVariance {
  return new SeasonalDomainVariance(code, name, 0, "", "", "open");
}
