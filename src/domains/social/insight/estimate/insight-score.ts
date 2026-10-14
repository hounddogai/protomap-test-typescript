import * as text from "../../../../kit/text.js";

/** Where a insight score is in its life cycle. */
export type InsightScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A insight score. Its code is unique within a tenant. */
export class InsightScore {
  code: string;
  title: string;
  openRate: number;
  unit: string;
  region: string;
  score: number;
  ceiling: number;
  limit: number;
  segment: string;
  status: InsightScoreStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    unit: string,
    region: string,
    score: number,
    ceiling: number,
    limit: number,
    segment: string,
    status: InsightScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.unit = unit;
    this.region = region;
    this.score = score;
    this.ceiling = ceiling;
    this.limit = limit;
    this.segment = segment;
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

  canMoveTo(next: InsightScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: InsightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight score"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.openRate - this.score) * 100) / 100;
  }

  copy(): InsightScore {
    return new InsightScore(
      this.code,
      this.title,
      this.openRate,
      this.unit,
      this.region,
      this.score,
      this.ceiling,
      this.limit,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a insight score in status idle. */
export function newInsightScore(code: string, title: string): InsightScore {
  return new InsightScore(code, title, 0, "", "", 0, 0, 0, "", "idle");
}
