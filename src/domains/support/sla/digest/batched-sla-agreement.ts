import * as text from "../../../../kit/text.js";

/** Where a batched sla agreement is in its life cycle. */
export type BatchedSlaAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched sla agreement and its current status. */
export class BatchedSlaAgreement {
  code: string;
  label: string;
  summary: string;
  createdAt: number;
  impressions: number;
  batchSize: number;
  currency: string;
  rate: number;
  tags: string[];
  status: BatchedSlaAgreementStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    createdAt: number,
    impressions: number,
    batchSize: number,
    currency: string,
    rate: number,
    tags: string[],
    status: BatchedSlaAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.batchSize = batchSize;
    this.currency = currency;
    this.rate = rate;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedSlaAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedSlaAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched sla agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched sla agreement"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.rate * this.createdAt * 100) / 100;
  }

  copy(): BatchedSlaAgreement {
    return new BatchedSlaAgreement(
      this.code,
      this.label,
      this.summary,
      this.createdAt,
      this.impressions,
      this.batchSize,
      this.currency,
      this.rate,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched sla agreement in status idle. */
export function newBatchedSlaAgreement(code: string, label: string): BatchedSlaAgreement {
  return new BatchedSlaAgreement(code, label, "", 0, 0, 0, "", 0, [], "idle");
}
