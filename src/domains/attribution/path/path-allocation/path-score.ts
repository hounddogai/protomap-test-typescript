import * as text from "../../../../kit/text.js";

/** Where a path score is in its life cycle. */
export type PathScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One path score, with what the planners need to act on it. */
export class PathScore {
  code: string;
  title: string;
  campaignRef: string;
  budget: number;
  score: number;
  summary: string;
  status: PathScoreStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    budget: number,
    score: number,
    summary: string,
    status: PathScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.score = score;
    this.summary = summary;
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

  canMoveTo(next: PathScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.score - this.budget) * 100) / 100;
  }

  copy(): PathScore {
    return new PathScore(this.code, this.title, this.campaignRef, this.budget, this.score, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path score in status idle. */
export function newPathScore(code: string, title: string): PathScore {
  return new PathScore(code, title, "", 0, 0, "", "idle");
}
