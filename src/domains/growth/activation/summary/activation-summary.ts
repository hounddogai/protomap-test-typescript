/**
 * The activation summary records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation summary is in its life cycle. */
export type ActivationSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One activation summary, with what the planners need to act on it. */
export class ActivationSummary {
  code: string;
  title: string;
  locale: string;
  batchSize: number;
  ratio: number;
  region: string;
  sequence: number;
  status: ActivationSummaryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    batchSize: number,
    ratio: number,
    region: string,
    sequence: number,
    status: ActivationSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.region = region;
    this.sequence = sequence;
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

  canMoveTo(next: ActivationSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: ActivationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"activation summary"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.ratio - this.sequence) * 100) / 100;
  }

  copy(): ActivationSummary {
    return new ActivationSummary(
      this.code,
      this.title,
      this.locale,
      this.batchSize,
      this.ratio,
      this.region,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a activation summary in status draft. */
export function newActivationSummary(code: string, title: string): ActivationSummary {
  return new ActivationSummary(code, title, "", 0, 0, "", 0, "draft");
}
