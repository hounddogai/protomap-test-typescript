import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort override is in its life cycle. */
export type ScheduledCohortOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled cohort override. Its code is unique within a tenant. */
export class ScheduledCohortOverride {
  code: string;
  title: string;
  amount: number;
  summary: string;
  revision: number;
  archived: boolean;
  campaignRef: string;
  sequence: number;
  locale: string;
  status: ScheduledCohortOverrideStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    summary: string,
    revision: number,
    archived: boolean,
    campaignRef: string,
    sequence: number,
    locale: string,
    status: ScheduledCohortOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.summary = summary;
    this.revision = revision;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.sequence = sequence;
    this.locale = locale;
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

  canMoveTo(next: ScheduledCohortOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledCohortOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence - this.amount) * 100) / 100;
  }

  copy(): ScheduledCohortOverride {
    return new ScheduledCohortOverride(
      this.code,
      this.title,
      this.amount,
      this.summary,
      this.revision,
      this.archived,
      this.campaignRef,
      this.sequence,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled cohort override in status proposed. */
export function newScheduledCohortOverride(code: string, title: string): ScheduledCohortOverride {
  return new ScheduledCohortOverride(code, title, 0, "", 0, false, "", 0, "", "proposed");
}
