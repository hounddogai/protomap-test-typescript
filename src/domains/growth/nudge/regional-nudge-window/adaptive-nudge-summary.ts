import * as text from "../../../../kit/text.js";

/** Where a adaptive nudge summary is in its life cycle. */
export type AdaptiveNudgeSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive nudge summary as the nudge team keeps it. */
export class AdaptiveNudgeSummary {
  code: string;
  title: string;
  ceiling: number;
  phone: string;
  reviewer: string;
  checksum: string;
  approved: boolean;
  status: AdaptiveNudgeSummaryStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    phone: string,
    reviewer: string,
    checksum: string,
    approved: boolean,
    status: AdaptiveNudgeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.phone = phone;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.approved = approved;
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

  canMoveTo(next: AdaptiveNudgeSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: AdaptiveNudgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive nudge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive nudge summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): AdaptiveNudgeSummary {
    return new AdaptiveNudgeSummary(
      this.code,
      this.title,
      this.ceiling,
      this.phone,
      this.reviewer,
      this.checksum,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive nudge summary in status new. */
export function newAdaptiveNudgeSummary(code: string, title: string): AdaptiveNudgeSummary {
  return new AdaptiveNudgeSummary(code, title, 0, "", "", "", false, "new");
}
