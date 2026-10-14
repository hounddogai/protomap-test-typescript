import * as text from "../../../../kit/text.js";

/** Where a insight bundle is in its life cycle. */
export type InsightBundleStatus = "created" | "validated" | "published" | "retired";

/** The record of a insight bundle and its current status. */
export class InsightBundle {
  code: string;
  name: string;
  description: string;
  endsAt: number;
  score: number;
  cohort: string;
  status: InsightBundleStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    endsAt: number,
    score: number,
    cohort: string,
    status: InsightBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.endsAt = endsAt;
    this.score = score;
    this.cohort = cohort;
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

  canMoveTo(next: InsightBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
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

  moveTo(next: InsightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.score + this.endsAt) * 100) / 100;
  }

  copy(): InsightBundle {
    return new InsightBundle(this.code, this.name, this.description, this.endsAt, this.score, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight bundle in status created. */
export function newInsightBundle(code: string, name: string): InsightBundle {
  return new InsightBundle(code, name, "", 0, 0, "", "created");
}
