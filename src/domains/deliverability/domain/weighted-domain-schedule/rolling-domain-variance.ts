import * as text from "../../../../kit/text.js";

/** Where a rolling domain variance is in its life cycle. */
export type RollingDomainVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling domain variance. Its code is unique within a tenant. */
export class RollingDomainVariance {
  code: string;
  name: string;
  frequencyCap: number;
  journeyId: string;
  impressions: number;
  score: number;
  status: RollingDomainVarianceStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    journeyId: string,
    impressions: number,
    score: number,
    status: RollingDomainVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.impressions = impressions;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingDomainVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingDomainVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling domain variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling domain variance"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.score - this.frequencyCap) * 100) / 100;
  }

  copy(): RollingDomainVariance {
    return new RollingDomainVariance(
      this.code,
      this.name,
      this.frequencyCap,
      this.journeyId,
      this.impressions,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling domain variance in status draft. */
export function newRollingDomainVariance(code: string, name: string): RollingDomainVariance {
  return new RollingDomainVariance(code, name, 0, "", 0, 0, "draft");
}
