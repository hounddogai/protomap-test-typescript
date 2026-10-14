import * as text from "../../../../kit/text.js";

/** Where a rolling cohort milestone is in its life cycle. */
export type RollingCohortMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling cohort milestone and its current status. */
export class RollingCohortMilestone {
  code: string;
  title: string;
  reviewer: string;
  revision: number;
  attempts: number;
  limit: number;
  locale: string;
  status: RollingCohortMilestoneStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    revision: number,
    attempts: number,
    limit: number,
    locale: string,
    status: RollingCohortMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.revision = revision;
    this.attempts = attempts;
    this.limit = limit;
    this.locale = locale;
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

  canMoveTo(next: RollingCohortMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingCohortMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling cohort milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"rolling cohort milestone"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.attempts * this.revision * 100) / 100;
  }

  copy(): RollingCohortMilestone {
    return new RollingCohortMilestone(
      this.code,
      this.title,
      this.reviewer,
      this.revision,
      this.attempts,
      this.limit,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling cohort milestone in status requested. */
export function newRollingCohortMilestone(code: string, title: string): RollingCohortMilestone {
  return new RollingCohortMilestone(code, title, "", 0, 0, 0, "", "requested");
}
