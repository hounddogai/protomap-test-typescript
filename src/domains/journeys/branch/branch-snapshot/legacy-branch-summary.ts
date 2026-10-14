import * as text from "../../../../kit/text.js";

/** Where a legacy branch summary is in its life cycle. */
export type LegacyBranchSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy branch summary and its current status. */
export class LegacyBranchSummary {
  code: string;
  label: string;
  discount: number;
  checksum: string;
  title: string;
  cohort: string;
  status: LegacyBranchSummaryStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    checksum: string,
    title: string,
    cohort: string,
    status: LegacyBranchSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.checksum = checksum;
    this.title = title;
    this.cohort = cohort;
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

  canMoveTo(next: LegacyBranchSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyBranchSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy branch summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): LegacyBranchSummary {
    return new LegacyBranchSummary(
      this.code,
      this.label,
      this.discount,
      this.checksum,
      this.title,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy branch summary in status new. */
export function newLegacyBranchSummary(code: string, label: string): LegacyBranchSummary {
  return new LegacyBranchSummary(code, label, 0, "", "", "", "new");
}
