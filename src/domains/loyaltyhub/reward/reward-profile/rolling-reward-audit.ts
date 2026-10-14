import * as text from "../../../../kit/text.js";

/** Where a rolling reward audit is in its life cycle. */
export type RollingRewardAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling reward audit and its current status. */
export class RollingRewardAudit {
  code: string;
  title: string;
  contactEmail: string;
  openRate: number;
  name: string;
  campaignRef: string;
  priority: number;
  durationMinutes: number;
  rate: number;
  status: RollingRewardAuditStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    openRate: number,
    name: string,
    campaignRef: string,
    priority: number,
    durationMinutes: number,
    rate: number,
    status: RollingRewardAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.name = name;
    this.campaignRef = campaignRef;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingRewardAuditStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RollingRewardAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reward audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.openRate * this.durationMinutes * 100) / 100;
  }

  copy(): RollingRewardAudit {
    return new RollingRewardAudit(
      this.code,
      this.title,
      this.contactEmail,
      this.openRate,
      this.name,
      this.campaignRef,
      this.priority,
      this.durationMinutes,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling reward audit in status open. */
export function newRollingRewardAudit(code: string, title: string): RollingRewardAudit {
  return new RollingRewardAudit(code, title, "", 0, "", "", 0, 0, 0, "open");
}
