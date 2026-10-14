/**
 * The reputation exception records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation exception is in its life cycle. */
export type ReputationExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reputation exception as the reputation team keeps it. */
export class ReputationException {
  code: string;
  label: string;
  threshold: number;
  tags: string[];
  active: boolean;
  summary: string;
  sendAt: number;
  minimum: number;
  impressions: number;
  checksum: string;
  retries: number;
  status: ReputationExceptionStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    tags: string[],
    active: boolean,
    summary: string,
    sendAt: number,
    minimum: number,
    impressions: number,
    checksum: string,
    retries: number,
    status: ReputationExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.tags = tags;
    this.active = active;
    this.summary = summary;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.impressions = impressions;
    this.checksum = checksum;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ReputationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.sendAt - this.minimum) * 100) / 100;
  }

  copy(): ReputationException {
    return new ReputationException(
      this.code,
      this.label,
      this.threshold,
      this.tags,
      this.active,
      this.summary,
      this.sendAt,
      this.minimum,
      this.impressions,
      this.checksum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation exception in status draft. */
export function newReputationException(code: string, label: string): ReputationException {
  return new ReputationException(code, label, 0, [], false, "", 0, 0, 0, "", 0, "draft");
}
