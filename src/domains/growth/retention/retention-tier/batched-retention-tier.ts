/**
 * The batched retention tier records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched retention tier is in its life cycle. */
export type BatchedRetentionTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched retention tier and its current status. */
export class BatchedRetentionTier {
  code: string;
  name: string;
  archived: boolean;
  source: string;
  sendAt: number;
  locale: string;
  endsAt: number;
  budget: number;
  status: BatchedRetentionTierStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    source: string,
    sendAt: number,
    locale: string,
    endsAt: number,
    budget: number,
    status: BatchedRetentionTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.source = source;
    this.sendAt = sendAt;
    this.locale = locale;
    this.endsAt = endsAt;
    this.budget = budget;
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

  canMoveTo(next: BatchedRetentionTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedRetentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched retention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.sendAt + this.budget) * 100) / 100;
  }

  copy(): BatchedRetentionTier {
    return new BatchedRetentionTier(
      this.code,
      this.name,
      this.archived,
      this.source,
      this.sendAt,
      this.locale,
      this.endsAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched retention tier in status idle. */
export function newBatchedRetentionTier(code: string, name: string): BatchedRetentionTier {
  return new BatchedRetentionTier(code, name, false, "", 0, "", 0, 0, "idle");
}
