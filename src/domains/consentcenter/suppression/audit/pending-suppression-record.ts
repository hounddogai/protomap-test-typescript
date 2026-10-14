import * as text from "../../../../kit/text.js";

/** Where a pending suppression record is in its life cycle. */
export type PendingSuppressionRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending suppression record. Its code is unique within a tenant. */
export class PendingSuppressionRecord {
  code: string;
  label: string;
  conversionRate: number;
  rate: number;
  category: string;
  startsAt: number;
  retries: number;
  cohort: string;
  audienceId: string;
  externalRef: string;
  currency: string;
  status: PendingSuppressionRecordStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    rate: number,
    category: string,
    startsAt: number,
    retries: number,
    cohort: string,
    audienceId: string,
    externalRef: string,
    currency: string,
    status: PendingSuppressionRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.category = category;
    this.startsAt = startsAt;
    this.retries = retries;
    this.cohort = cohort;
    this.audienceId = audienceId;
    this.externalRef = externalRef;
    this.currency = currency;
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

  canMoveTo(next: PendingSuppressionRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingSuppressionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending suppression record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.startsAt + this.retries) * 100) / 100;
  }

  copy(): PendingSuppressionRecord {
    return new PendingSuppressionRecord(
      this.code,
      this.label,
      this.conversionRate,
      this.rate,
      this.category,
      this.startsAt,
      this.retries,
      this.cohort,
      this.audienceId,
      this.externalRef,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending suppression record in status new. */
export function newPendingSuppressionRecord(code: string, label: string): PendingSuppressionRecord {
  return new PendingSuppressionRecord(code, label, 0, 0, "", 0, 0, "", "", "", "", "new");
}
