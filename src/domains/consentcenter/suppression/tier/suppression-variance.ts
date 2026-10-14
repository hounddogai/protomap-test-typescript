import * as text from "../../../../kit/text.js";

/** Where a suppression variance is in its life cycle. */
export type SuppressionVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a suppression variance and its current status. */
export class SuppressionVariance {
  code: string;
  title: string;
  margin: number;
  startsAt: number;
  retries: number;
  cohort: string;
  source: string;
  status: SuppressionVarianceStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    startsAt: number,
    retries: number,
    cohort: string,
    source: string,
    status: SuppressionVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.startsAt = startsAt;
    this.retries = retries;
    this.cohort = cohort;
    this.source = source;
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

  canMoveTo(next: SuppressionVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: SuppressionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round(this.startsAt * this.retries * 100) / 100;
  }

  copy(): SuppressionVariance {
    return new SuppressionVariance(
      this.code,
      this.title,
      this.margin,
      this.startsAt,
      this.retries,
      this.cohort,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a suppression variance in status idle. */
export function newSuppressionVariance(code: string, title: string): SuppressionVariance {
  return new SuppressionVariance(code, title, 0, 0, 0, "", "", "idle");
}
