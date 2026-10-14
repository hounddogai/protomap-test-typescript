import * as text from "../../../../kit/text.js";

/** Where a lenient bounce rollup is in its life cycle. */
export type LenientBounceRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient bounce rollup and its current status. */
export class LenientBounceRollup {
  code: string;
  label: string;
  budget: number;
  locale: string;
  attempts: number;
  externalRef: string;
  source: string;
  score: number;
  status: LenientBounceRollupStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    locale: string,
    attempts: number,
    externalRef: string,
    source: string,
    score: number,
    status: LenientBounceRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.locale = locale;
    this.attempts = attempts;
    this.externalRef = externalRef;
    this.source = source;
    this.score = score;
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

  canMoveTo(next: LenientBounceRollupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBounceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bounce rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.attempts * 100) / 100;
  }

  copy(): LenientBounceRollup {
    return new LenientBounceRollup(
      this.code,
      this.label,
      this.budget,
      this.locale,
      this.attempts,
      this.externalRef,
      this.source,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient bounce rollup in status open. */
export function newLenientBounceRollup(code: string, label: string): LenientBounceRollup {
  return new LenientBounceRollup(code, label, 0, "", 0, "", "", 0, "open");
}
