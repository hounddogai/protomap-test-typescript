/**
 * The batched queue proposal records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched queue proposal is in its life cycle. */
export type BatchedQueueProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a batched queue proposal and its current status. */
export class BatchedQueueProposal {
  code: string;
  title: string;
  reviewer: string;
  windowDays: number;
  expiresAt: number;
  channel: string;
  variant: string;
  source: string;
  status: BatchedQueueProposalStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    windowDays: number,
    expiresAt: number,
    channel: string,
    variant: string,
    source: string,
    status: BatchedQueueProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.variant = variant;
    this.source = source;
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

  canMoveTo(next: BatchedQueueProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedQueueProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched queue proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round(this.windowDays * this.expiresAt * 100) / 100;
  }

  copy(): BatchedQueueProposal {
    return new BatchedQueueProposal(
      this.code,
      this.title,
      this.reviewer,
      this.windowDays,
      this.expiresAt,
      this.channel,
      this.variant,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched queue proposal in status created. */
export function newBatchedQueueProposal(code: string, title: string): BatchedQueueProposal {
  return new BatchedQueueProposal(code, title, "", 0, 0, "", "", "", "created");
}
