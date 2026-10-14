/**
 * The sender agreement records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender agreement is in its life cycle. */
export type SenderAgreementStatus = "requested" | "granted" | "revoked" | "expired";

/** One sender agreement, with what the planners need to act on it. */
export class SenderAgreement {
  code: string;
  title: string;
  cohort: string;
  attempts: number;
  threshold: number;
  updatedAt: number;
  impressions: number;
  tags: string[];
  channel: string;
  batchSize: number;
  budget: number;
  status: SenderAgreementStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    attempts: number,
    threshold: number,
    updatedAt: number,
    impressions: number,
    tags: string[],
    channel: string,
    batchSize: number,
    budget: number,
    status: SenderAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.attempts = attempts;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.tags = tags;
    this.channel = channel;
    this.batchSize = batchSize;
    this.budget = budget;
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

  canMoveTo(next: SenderAgreementStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SenderAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"sender agreement"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.budget * this.batchSize * 100) / 100;
  }

  copy(): SenderAgreement {
    return new SenderAgreement(
      this.code,
      this.title,
      this.cohort,
      this.attempts,
      this.threshold,
      this.updatedAt,
      this.impressions,
      this.tags,
      this.channel,
      this.batchSize,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sender agreement in status requested. */
export function newSenderAgreement(code: string, title: string): SenderAgreement {
  return new SenderAgreement(code, title, "", 0, 0, 0, 0, [], "", 0, 0, "requested");
}
