import * as text from "../../../../kit/text.js";

/** Where a scheduled bid rule quota is in its life cycle. */
export type ScheduledBidRuleQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled bid rule quota, with what the planners need to act on it. */
export class ScheduledBidRuleQuota {
  code: string;
  name: string;
  frequencyCap: number;
  createdAt: number;
  windowDays: number;
  checksum: string;
  retries: number;
  batchSize: number;
  ownerId: string;
  status: ScheduledBidRuleQuotaStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    createdAt: number,
    windowDays: number,
    checksum: string,
    retries: number,
    batchSize: number,
    ownerId: string,
    status: ScheduledBidRuleQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.retries = retries;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledBidRuleQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledBidRuleQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bid rule quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt - this.retries) * 100) / 100;
  }

  copy(): ScheduledBidRuleQuota {
    return new ScheduledBidRuleQuota(
      this.code,
      this.name,
      this.frequencyCap,
      this.createdAt,
      this.windowDays,
      this.checksum,
      this.retries,
      this.batchSize,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled bid rule quota in status proposed. */
export function newScheduledBidRuleQuota(code: string, name: string): ScheduledBidRuleQuota {
  return new ScheduledBidRuleQuota(code, name, 0, 0, 0, "", 0, 0, "", "proposed");
}
