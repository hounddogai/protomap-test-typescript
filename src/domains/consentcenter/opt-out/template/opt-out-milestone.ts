import * as text from "../../../../kit/text.js";

/** Where a opt out milestone is in its life cycle. */
export type OptOutMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A opt out milestone as the opt out team keeps it. */
export class OptOutMilestone {
  code: string;
  name: string;
  conversionRate: number;
  ownerId: string;
  locale: string;
  quantity: number;
  priority: number;
  windowDays: number;
  checksum: string;
  phone: string;
  summary: string;
  status: OptOutMilestoneStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    ownerId: string,
    locale: string,
    quantity: number,
    priority: number,
    windowDays: number,
    checksum: string,
    phone: string,
    summary: string,
    status: OptOutMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
    this.locale = locale;
    this.quantity = quantity;
    this.priority = priority;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.phone = phone;
    this.summary = summary;
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

  canMoveTo(next: OptOutMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: OptOutMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.priority - this.windowDays) * 100) / 100;
  }

  copy(): OptOutMilestone {
    return new OptOutMilestone(
      this.code,
      this.name,
      this.conversionRate,
      this.ownerId,
      this.locale,
      this.quantity,
      this.priority,
      this.windowDays,
      this.checksum,
      this.phone,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a opt out milestone in status requested. */
export function newOptOutMilestone(code: string, name: string): OptOutMilestone {
  return new OptOutMilestone(code, name, 0, "", "", 0, 0, 0, "", "", "", "requested");
}
