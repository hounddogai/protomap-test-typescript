import * as text from "../../../../kit/text.js";

/** Where a manual wait quota is in its life cycle. */
export type ManualWaitQuotaStatus = "created" | "validated" | "published" | "retired";

/** A manual wait quota as the wait team keeps it. */
export class ManualWaitQuota {
  code: string;
  name: string;
  batchSize: number;
  checksum: string;
  reviewer: string;
  conversionRate: number;
  timezone: string;
  priority: number;
  channel: string;
  status: ManualWaitQuotaStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    checksum: string,
    reviewer: string,
    conversionRate: number,
    timezone: string,
    priority: number,
    channel: string,
    status: ManualWaitQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.priority = priority;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualWaitQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualWaitQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual wait quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.conversionRate + this.batchSize) * 100) / 100;
  }

  copy(): ManualWaitQuota {
    return new ManualWaitQuota(
      this.code,
      this.name,
      this.batchSize,
      this.checksum,
      this.reviewer,
      this.conversionRate,
      this.timezone,
      this.priority,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual wait quota in status created. */
export function newManualWaitQuota(code: string, name: string): ManualWaitQuota {
  return new ManualWaitQuota(code, name, 0, "", "", 0, "", 0, "", "created");
}
