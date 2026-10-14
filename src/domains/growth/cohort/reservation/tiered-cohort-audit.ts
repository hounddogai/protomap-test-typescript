import * as text from "../../../../kit/text.js";

/** Where a tiered cohort audit is in its life cycle. */
export type TieredCohortAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered cohort audit, with what the planners need to act on it. */
export class TieredCohortAudit {
  code: string;
  label: string;
  journeyId: string;
  timezone: string;
  country: string;
  active: boolean;
  reviewer: string;
  createdAt: number;
  status: TieredCohortAuditStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    timezone: string,
    country: string,
    active: boolean,
    reviewer: string,
    createdAt: number,
    status: TieredCohortAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.country = country;
    this.active = active;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
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

  canMoveTo(next: TieredCohortAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: TieredCohortAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): TieredCohortAudit {
    return new TieredCohortAudit(
      this.code,
      this.label,
      this.journeyId,
      this.timezone,
      this.country,
      this.active,
      this.reviewer,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered cohort audit in status proposed. */
export function newTieredCohortAudit(code: string, label: string): TieredCohortAudit {
  return new TieredCohortAudit(code, label, "", "", "", false, "", 0, "proposed");
}
