import * as text from "../../../../kit/text.js";

/** Where a complaint request is in its life cycle. */
export type ComplaintRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A complaint request as the complaint team keeps it. */
export class ComplaintRequest {
  code: string;
  title: string;
  campaignRef: string;
  rate: number;
  clicks: number;
  cohort: string;
  status: ComplaintRequestStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    rate: number,
    clicks: number,
    cohort: string,
    status: ComplaintRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.clicks = clicks;
    this.cohort = cohort;
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

  canMoveTo(next: ComplaintRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ComplaintRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.rate) * 100) / 100;
  }

  copy(): ComplaintRequest {
    return new ComplaintRequest(
      this.code,
      this.title,
      this.campaignRef,
      this.rate,
      this.clicks,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a complaint request in status idle. */
export function newComplaintRequest(code: string, title: string): ComplaintRequest {
  return new ComplaintRequest(code, title, "", 0, 0, "", "idle");
}
