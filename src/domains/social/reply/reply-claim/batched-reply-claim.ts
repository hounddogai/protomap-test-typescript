/**
 * The batched reply claim records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched reply claim is in its life cycle. */
export type BatchedReplyClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched reply claim and its current status. */
export class BatchedReplyClaim {
  code: string;
  label: string;
  attributes: Map<string, string>;
  weight: number;
  locale: string;
  conversionRate: number;
  retries: number;
  category: string;
  archived: boolean;
  reviewer: string;
  cohort: string;
  status: BatchedReplyClaimStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    weight: number,
    locale: string,
    conversionRate: number,
    retries: number,
    category: string,
    archived: boolean,
    reviewer: string,
    cohort: string,
    status: BatchedReplyClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.weight = weight;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.category = category;
    this.archived = archived;
    this.reviewer = reviewer;
    this.cohort = cohort;
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

  canMoveTo(next: BatchedReplyClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.retries) * 100) / 100;
  }

  copy(): BatchedReplyClaim {
    return new BatchedReplyClaim(
      this.code,
      this.label,
      this.attributes,
      this.weight,
      this.locale,
      this.conversionRate,
      this.retries,
      this.category,
      this.archived,
      this.reviewer,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched reply claim in status idle. */
export function newBatchedReplyClaim(code: string, label: string): BatchedReplyClaim {
  return new BatchedReplyClaim(code, label, new Map<string, string>(), 0, "", 0, 0, "", false, "", "", "idle");
}
