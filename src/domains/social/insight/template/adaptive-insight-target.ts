import * as text from "../../../../kit/text.js";

/** Where a adaptive insight target is in its life cycle. */
export type AdaptiveInsightTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive insight target. Its code is unique within a tenant. */
export class AdaptiveInsightTarget {
  code: string;
  title: string;
  attempts: number;
  cost: number;
  locale: string;
  maximum: number;
  source: string;
  status: AdaptiveInsightTargetStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    cost: number,
    locale: string,
    maximum: number,
    source: string,
    status: AdaptiveInsightTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.cost = cost;
    this.locale = locale;
    this.maximum = maximum;
    this.source = source;
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

  canMoveTo(next: AdaptiveInsightTargetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveInsightTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive insight target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round((this.cost + this.attempts) * 100) / 100;
  }

  copy(): AdaptiveInsightTarget {
    return new AdaptiveInsightTarget(
      this.code,
      this.title,
      this.attempts,
      this.cost,
      this.locale,
      this.maximum,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive insight target in status new. */
export function newAdaptiveInsightTarget(code: string, title: string): AdaptiveInsightTarget {
  return new AdaptiveInsightTarget(code, title, 0, 0, "", 0, "", "new");
}
