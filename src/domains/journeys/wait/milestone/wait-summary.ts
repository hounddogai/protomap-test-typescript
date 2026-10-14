import * as text from "../../../../kit/text.js";

/** Where a wait summary is in its life cycle. */
export type WaitSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** One wait summary, with what the planners need to act on it. */
export class WaitSummary {
  code: string;
  label: string;
  threshold: number;
  name: string;
  cohort: string;
  status: WaitSummaryStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    name: string,
    cohort: string,
    status: WaitSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.name = name;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): WaitSummary {
    return new WaitSummary(this.code, this.label, this.threshold, this.name, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a wait summary in status requested. */
export function newWaitSummary(code: string, label: string): WaitSummary {
  return new WaitSummary(code, label, 0, "", "", "requested");
}
