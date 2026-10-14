import * as text from "../../../../kit/text.js";

/** Where a scheduled macro summary is in its life cycle. */
export type ScheduledMacroSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled macro summary as the macro team keeps it. */
export class ScheduledMacroSummary {
  code: string;
  title: string;
  priority: number;
  cohort: string;
  ratio: number;
  windowDays: number;
  margin: number;
  frequencyCap: number;
  approved: boolean;
  score: number;
  segment: string;
  status: ScheduledMacroSummaryStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cohort: string,
    ratio: number,
    windowDays: number,
    margin: number,
    frequencyCap: number,
    approved: boolean,
    score: number,
    segment: string,
    status: ScheduledMacroSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cohort = cohort;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.score = score;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledMacroSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledMacroSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled macro summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round((this.windowDays - this.ratio) * 100) / 100;
  }

  copy(): ScheduledMacroSummary {
    return new ScheduledMacroSummary(
      this.code,
      this.title,
      this.priority,
      this.cohort,
      this.ratio,
      this.windowDays,
      this.margin,
      this.frequencyCap,
      this.approved,
      this.score,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled macro summary in status proposed. */
export function newScheduledMacroSummary(code: string, title: string): ScheduledMacroSummary {
  return new ScheduledMacroSummary(code, title, 0, "", 0, 0, 0, 0, false, 0, "", "proposed");
}
