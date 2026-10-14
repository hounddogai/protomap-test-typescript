import * as text from "../../../../kit/text.js";

/** Where a scheduled suppression quota is in its life cycle. */
export type ScheduledSuppressionQuotaStatus = "created" | "validated" | "published" | "retired";

/** One scheduled suppression quota, with what the planners need to act on it. */
export class ScheduledSuppressionQuota {
  code: string;
  title: string;
  retries: number;
  visible: boolean;
  checksum: string;
  cohort: string;
  conversionRate: number;
  region: string;
  status: ScheduledSuppressionQuotaStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    visible: boolean,
    checksum: string,
    cohort: string,
    conversionRate: number,
    region: string,
    status: ScheduledSuppressionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.visible = visible;
    this.checksum = checksum;
    this.cohort = cohort;
    this.conversionRate = conversionRate;
    this.region = region;
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

  canMoveTo(next: ScheduledSuppressionQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSuppressionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled suppression quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.retries + this.conversionRate) * 100) / 100;
  }

  copy(): ScheduledSuppressionQuota {
    return new ScheduledSuppressionQuota(
      this.code,
      this.title,
      this.retries,
      this.visible,
      this.checksum,
      this.cohort,
      this.conversionRate,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled suppression quota in status created. */
export function newScheduledSuppressionQuota(code: string, title: string): ScheduledSuppressionQuota {
  return new ScheduledSuppressionQuota(code, title, 0, false, "", "", 0, "", "created");
}
