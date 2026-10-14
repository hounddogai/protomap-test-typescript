import * as text from "../../../../kit/text.js";

/** Where a rolling cohort exception is in its life cycle. */
export type RollingCohortExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling cohort exception. Its code is unique within a tenant. */
export class RollingCohortException {
  code: string;
  name: string;
  active: boolean;
  durationMinutes: number;
  campaignRef: string;
  discount: number;
  status: RollingCohortExceptionStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    durationMinutes: number,
    campaignRef: string,
    discount: number,
    status: RollingCohortExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.discount = discount;
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

  canMoveTo(next: RollingCohortExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingCohortExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling cohort exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling cohort exception"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.discount - this.durationMinutes) * 100) / 100;
  }

  copy(): RollingCohortException {
    return new RollingCohortException(
      this.code,
      this.name,
      this.active,
      this.durationMinutes,
      this.campaignRef,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling cohort exception in status new. */
export function newRollingCohortException(code: string, name: string): RollingCohortException {
  return new RollingCohortException(code, name, false, 0, "", 0, "new");
}
