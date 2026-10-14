import * as text from "../../../../kit/text.js";

/** Where a conversion summary is in its life cycle. */
export type ConversionSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One conversion summary, with what the planners need to act on it. */
export class ConversionSummary {
  code: string;
  label: string;
  source: string;
  budget: number;
  region: string;
  status: ConversionSummaryStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    budget: number,
    region: string,
    status: ConversionSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.budget = budget;
    this.region = region;
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

  canMoveTo(next: ConversionSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ConversionSummary {
    return new ConversionSummary(this.code, this.label, this.source, this.budget, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a conversion summary in status new. */
export function newConversionSummary(code: string, label: string): ConversionSummary {
  return new ConversionSummary(code, label, "", 0, "", "new");
}
