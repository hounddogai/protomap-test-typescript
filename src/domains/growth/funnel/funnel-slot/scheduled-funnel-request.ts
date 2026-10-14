import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel request is in its life cycle. */
export type ScheduledFunnelRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled funnel request and its current status. */
export class ScheduledFunnelRequest {
  code: string;
  name: string;
  conversionRate: number;
  ceiling: number;
  discount: number;
  status: ScheduledFunnelRequestStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    ceiling: number,
    discount: number,
    status: ScheduledFunnelRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.ceiling = ceiling;
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

  canMoveTo(next: ScheduledFunnelRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled funnel request"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.discount + this.ceiling) * 100) / 100;
  }

  copy(): ScheduledFunnelRequest {
    return new ScheduledFunnelRequest(
      this.code,
      this.name,
      this.conversionRate,
      this.ceiling,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled funnel request in status new. */
export function newScheduledFunnelRequest(code: string, name: string): ScheduledFunnelRequest {
  return new ScheduledFunnelRequest(code, name, 0, 0, 0, "new");
}
