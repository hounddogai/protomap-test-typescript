import * as text from "../../../../kit/text.js";

/** Where a global opt out exception is in its life cycle. */
export type GlobalOptOutExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global opt out exception and its current status. */
export class GlobalOptOutException {
  code: string;
  title: string;
  active: boolean;
  frequencyCap: number;
  discount: number;
  limit: number;
  approved: boolean;
  reviewer: string;
  audienceId: string;
  openRate: number;
  status: GlobalOptOutExceptionStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    frequencyCap: number,
    discount: number,
    limit: number,
    approved: boolean,
    reviewer: string,
    audienceId: string,
    openRate: number,
    status: GlobalOptOutExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
    this.limit = limit;
    this.approved = approved;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalOptOutExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalOptOutExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global opt out exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global opt out exception"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.discount * this.openRate * 100) / 100;
  }

  copy(): GlobalOptOutException {
    return new GlobalOptOutException(
      this.code,
      this.title,
      this.active,
      this.frequencyCap,
      this.discount,
      this.limit,
      this.approved,
      this.reviewer,
      this.audienceId,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global opt out exception in status idle. */
export function newGlobalOptOutException(code: string, title: string): GlobalOptOutException {
  return new GlobalOptOutException(code, title, false, 0, 0, 0, false, "", "", 0, "idle");
}
