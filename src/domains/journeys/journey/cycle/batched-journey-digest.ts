import * as text from "../../../../kit/text.js";

/** Where a batched journey digest is in its life cycle. */
export type BatchedJourneyDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched journey digest, with what the planners need to act on it. */
export class BatchedJourneyDigest {
  code: string;
  label: string;
  reviewer: string;
  frequencyCap: number;
  phone: string;
  audienceId: string;
  impressions: number;
  externalRef: string;
  retries: number;
  summary: string;
  sendAt: number;
  status: BatchedJourneyDigestStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    frequencyCap: number,
    phone: string,
    audienceId: string,
    impressions: number,
    externalRef: string,
    retries: number,
    summary: string,
    sendAt: number,
    status: BatchedJourneyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.externalRef = externalRef;
    this.retries = retries;
    this.summary = summary;
    this.sendAt = sendAt;
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

  canMoveTo(next: BatchedJourneyDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedJourneyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.frequencyCap + this.sendAt) * 100) / 100;
  }

  copy(): BatchedJourneyDigest {
    return new BatchedJourneyDigest(
      this.code,
      this.label,
      this.reviewer,
      this.frequencyCap,
      this.phone,
      this.audienceId,
      this.impressions,
      this.externalRef,
      this.retries,
      this.summary,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched journey digest in status requested. */
export function newBatchedJourneyDigest(code: string, label: string): BatchedJourneyDigest {
  return new BatchedJourneyDigest(code, label, "", 0, "", "", 0, "", 0, "", 0, "requested");
}
