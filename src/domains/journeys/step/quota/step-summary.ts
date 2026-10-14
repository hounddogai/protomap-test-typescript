import * as text from "../../../../kit/text.js";

/** Where a step summary is in its life cycle. */
export type StepSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a step summary and its current status. */
export class StepSummary {
  code: string;
  name: string;
  archived: boolean;
  durationMinutes: number;
  reviewer: string;
  variant: string;
  version: number;
  active: boolean;
  status: StepSummaryStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    durationMinutes: number,
    reviewer: string,
    variant: string,
    version: number,
    active: boolean,
    status: StepSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.variant = variant;
    this.version = version;
    this.active = active;
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

  canMoveTo(next: StepSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
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

  moveTo(next: StepSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"step summary"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.version - this.durationMinutes) * 100) / 100;
  }

  copy(): StepSummary {
    return new StepSummary(
      this.code,
      this.name,
      this.archived,
      this.durationMinutes,
      this.reviewer,
      this.variant,
      this.version,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step summary in status draft. */
export function newStepSummary(code: string, name: string): StepSummary {
  return new StepSummary(code, name, false, 0, "", "", 0, false, "draft");
}
