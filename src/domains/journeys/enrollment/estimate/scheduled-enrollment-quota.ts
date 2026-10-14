import * as text from "../../../../kit/text.js";

/** Where a scheduled enrollment quota is in its life cycle. */
export type ScheduledEnrollmentQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled enrollment quota and its current status. */
export class ScheduledEnrollmentQuota {
  code: string;
  title: string;
  ownerId: string;
  priority: number;
  country: string;
  expiresAt: number;
  ratio: number;
  status: ScheduledEnrollmentQuotaStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    priority: number,
    country: string,
    expiresAt: number,
    ratio: number,
    status: ScheduledEnrollmentQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.priority = priority;
    this.country = country;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
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

  canMoveTo(next: ScheduledEnrollmentQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledEnrollmentQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled enrollment quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled enrollment quota"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority + this.expiresAt) * 100) / 100;
  }

  copy(): ScheduledEnrollmentQuota {
    return new ScheduledEnrollmentQuota(
      this.code,
      this.title,
      this.ownerId,
      this.priority,
      this.country,
      this.expiresAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled enrollment quota in status requested. */
export function newScheduledEnrollmentQuota(code: string, title: string): ScheduledEnrollmentQuota {
  return new ScheduledEnrollmentQuota(code, title, "", 0, "", 0, 0, "requested");
}
