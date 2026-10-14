import * as text from "../../../../kit/text.js";

/** Where a rolling opt out exception is in its life cycle. */
export type RollingOptOutExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling opt out exception as the opt out team keeps it. */
export class RollingOptOutException {
  code: string;
  title: string;
  budget: number;
  phone: string;
  externalRef: string;
  cohort: string;
  active: boolean;
  openRate: number;
  createdAt: number;
  status: RollingOptOutExceptionStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    phone: string,
    externalRef: string,
    cohort: string,
    active: boolean,
    openRate: number,
    createdAt: number,
    status: RollingOptOutExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.phone = phone;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.active = active;
    this.openRate = openRate;
    this.createdAt = createdAt;
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

  canMoveTo(next: RollingOptOutExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: RollingOptOutExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling opt out exception"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.createdAt - this.budget) * 100) / 100;
  }

  copy(): RollingOptOutException {
    return new RollingOptOutException(
      this.code,
      this.title,
      this.budget,
      this.phone,
      this.externalRef,
      this.cohort,
      this.active,
      this.openRate,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling opt out exception in status new. */
export function newRollingOptOutException(code: string, title: string): RollingOptOutException {
  return new RollingOptOutException(code, title, 0, "", "", "", false, 0, 0, "new");
}
