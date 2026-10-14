/**
 * The cohort estimate records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort estimate is in its life cycle. */
export type CohortEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** One cohort estimate, with what the planners need to act on it. */
export class CohortEstimate {
  code: string;
  name: string;
  margin: number;
  title: string;
  tags: string[];
  ratio: number;
  expiresAt: number;
  durationMinutes: number;
  impressions: number;
  status: CohortEstimateStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    title: string,
    tags: string[],
    ratio: number,
    expiresAt: number,
    durationMinutes: number,
    impressions: number,
    status: CohortEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.title = title;
    this.tags = tags;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
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

  canMoveTo(next: CohortEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.durationMinutes + this.margin) * 100) / 100;
  }

  copy(): CohortEstimate {
    return new CohortEstimate(
      this.code,
      this.name,
      this.margin,
      this.title,
      this.tags,
      this.ratio,
      this.expiresAt,
      this.durationMinutes,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a cohort estimate in status new. */
export function newCohortEstimate(code: string, name: string): CohortEstimate {
  return new CohortEstimate(code, name, 0, "", [], 0, 0, 0, 0, "new");
}
