import * as text from "../../../../kit/text.js";

/** Where a insight profile is in its life cycle. */
export type InsightProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a insight profile and its current status. */
export class InsightProfile {
  code: string;
  title: string;
  score: number;
  timezone: string;
  segment: string;
  weight: number;
  endsAt: number;
  region: string;
  priority: number;
  status: InsightProfileStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    timezone: string,
    segment: string,
    weight: number,
    endsAt: number,
    region: string,
    priority: number,
    status: InsightProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.timezone = timezone;
    this.segment = segment;
    this.weight = weight;
    this.endsAt = endsAt;
    this.region = region;
    this.priority = priority;
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

  canMoveTo(next: InsightProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: InsightProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round(this.weight * this.score * 100) / 100;
  }

  copy(): InsightProfile {
    return new InsightProfile(
      this.code,
      this.title,
      this.score,
      this.timezone,
      this.segment,
      this.weight,
      this.endsAt,
      this.region,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight profile in status draft. */
export function newInsightProfile(code: string, title: string): InsightProfile {
  return new InsightProfile(code, title, 0, "", "", 0, 0, "", 0, "draft");
}
