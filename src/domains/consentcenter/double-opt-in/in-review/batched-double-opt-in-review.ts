/**
 * The batched double opt in review records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched double opt in review is in its life cycle. */
export type BatchedDoubleOptInReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched double opt in review, with what the planners need to act on it. */
export class BatchedDoubleOptInReview {
  code: string;
  name: string;
  contactEmail: string;
  batchSize: number;
  frequencyCap: number;
  sequence: number;
  visible: boolean;
  audienceId: string;
  locale: string;
  status: BatchedDoubleOptInReviewStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    batchSize: number,
    frequencyCap: number,
    sequence: number,
    visible: boolean,
    audienceId: string,
    locale: string,
    status: BatchedDoubleOptInReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.sequence = sequence;
    this.visible = visible;
    this.audienceId = audienceId;
    this.locale = locale;
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

  canMoveTo(next: BatchedDoubleOptInReviewStatus): boolean {
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

  moveTo(next: BatchedDoubleOptInReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched double opt in review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched double opt in review"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.batchSize - this.sequence) * 100) / 100;
  }

  copy(): BatchedDoubleOptInReview {
    return new BatchedDoubleOptInReview(
      this.code,
      this.name,
      this.contactEmail,
      this.batchSize,
      this.frequencyCap,
      this.sequence,
      this.visible,
      this.audienceId,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched double opt in review in status requested. */
export function newBatchedDoubleOptInReview(code: string, name: string): BatchedDoubleOptInReview {
  return new BatchedDoubleOptInReview(code, name, "", 0, 0, 0, false, "", "", "requested");
}
