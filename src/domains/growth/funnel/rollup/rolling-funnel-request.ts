import * as text from "../../../../kit/text.js";

/** Where a rolling funnel request is in its life cycle. */
export type RollingFunnelRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a rolling funnel request and its current status. */
export class RollingFunnelRequest {
  code: string;
  title: string;
  region: string;
  discount: number;
  margin: number;
  status: RollingFunnelRequestStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    discount: number,
    margin: number,
    status: RollingFunnelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.discount = discount;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFunnelRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.discount - this.margin) * 100) / 100;
  }

  copy(): RollingFunnelRequest {
    return new RollingFunnelRequest(this.code, this.title, this.region, this.discount, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling funnel request in status planned. */
export function newRollingFunnelRequest(code: string, title: string): RollingFunnelRequest {
  return new RollingFunnelRequest(code, title, "", 0, 0, "planned");
}
