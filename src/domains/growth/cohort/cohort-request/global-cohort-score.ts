import * as text from "../../../../kit/text.js";

/** Where a global cohort score is in its life cycle. */
export type GlobalCohortScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global cohort score. Its code is unique within a tenant. */
export class GlobalCohortScore {
  code: string;
  name: string;
  region: string;
  threshold: number;
  clicks: number;
  score: number;
  ownerId: string;
  attributes: Map<string, string>;
  budget: number;
  status: GlobalCohortScoreStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    threshold: number,
    clicks: number,
    score: number,
    ownerId: string,
    attributes: Map<string, string>,
    budget: number,
    status: GlobalCohortScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.threshold = threshold;
    this.clicks = clicks;
    this.score = score;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalCohortScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalCohortScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global cohort score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global cohort score"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.budget * this.threshold * 100) / 100;
  }

  copy(): GlobalCohortScore {
    return new GlobalCohortScore(
      this.code,
      this.name,
      this.region,
      this.threshold,
      this.clicks,
      this.score,
      this.ownerId,
      this.attributes,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global cohort score in status idle. */
export function newGlobalCohortScore(code: string, name: string): GlobalCohortScore {
  return new GlobalCohortScore(code, name, "", 0, 0, 0, "", new Map<string, string>(), 0, "idle");
}
