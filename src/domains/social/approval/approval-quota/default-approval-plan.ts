import * as text from "../../../../kit/text.js";

/** Where a default approval plan is in its life cycle. */
export type DefaultApprovalPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A default approval plan. Its code is unique within a tenant. */
export class DefaultApprovalPlan {
  code: string;
  name: string;
  clicks: number;
  channel: string;
  discount: number;
  timezone: string;
  status: DefaultApprovalPlanStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    channel: string,
    discount: number,
    timezone: string,
    status: DefaultApprovalPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.channel = channel;
    this.discount = discount;
    this.timezone = timezone;
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

  canMoveTo(next: DefaultApprovalPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultApprovalPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default approval plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default approval plan"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.clicks * this.discount * 100) / 100;
  }

  copy(): DefaultApprovalPlan {
    return new DefaultApprovalPlan(
      this.code,
      this.name,
      this.clicks,
      this.channel,
      this.discount,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default approval plan in status requested. */
export function newDefaultApprovalPlan(code: string, name: string): DefaultApprovalPlan {
  return new DefaultApprovalPlan(code, name, 0, "", 0, "", "requested");
}
