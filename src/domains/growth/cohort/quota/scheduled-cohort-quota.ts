import * as text from "../../../../kit/text.js";

/** Where a scheduled cohort quota is in its life cycle. */
export type ScheduledCohortQuotaStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled cohort quota and its current status. */
export class ScheduledCohortQuota {
  code: string;
  title: string;
  name: string;
  utmSource: string;
  archived: boolean;
  floorValue: number;
  externalRef: string;
  status: ScheduledCohortQuotaStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    utmSource: string,
    archived: boolean,
    floorValue: number,
    externalRef: string,
    status: ScheduledCohortQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.utmSource = utmSource;
    this.archived = archived;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledCohortQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledCohortQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled cohort quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): ScheduledCohortQuota {
    return new ScheduledCohortQuota(
      this.code,
      this.title,
      this.name,
      this.utmSource,
      this.archived,
      this.floorValue,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled cohort quota in status created. */
export function newScheduledCohortQuota(code: string, title: string): ScheduledCohortQuota {
  return new ScheduledCohortQuota(code, title, "", "", false, 0, "", "created");
}
