/**
 * The batched flight draft records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched flight draft is in its life cycle. */
export type BatchedFlightDraftStatus = "created" | "validated" | "published" | "retired";

/** A batched flight draft. Its code is unique within a tenant. */
export class BatchedFlightDraft {
  code: string;
  title: string;
  utmSource: string;
  score: number;
  weight: number;
  category: string;
  startsAt: number;
  bid: number;
  createdAt: number;
  checksum: string;
  externalRef: string;
  status: BatchedFlightDraftStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    score: number,
    weight: number,
    category: string,
    startsAt: number,
    bid: number,
    createdAt: number,
    checksum: string,
    externalRef: string,
    status: BatchedFlightDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.score = score;
    this.weight = weight;
    this.category = category;
    this.startsAt = startsAt;
    this.bid = bid;
    this.createdAt = createdAt;
    this.checksum = checksum;
    this.externalRef = externalRef;
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

  canMoveTo(next: BatchedFlightDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedFlightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.startsAt - this.weight) * 100) / 100;
  }

  copy(): BatchedFlightDraft {
    return new BatchedFlightDraft(
      this.code,
      this.title,
      this.utmSource,
      this.score,
      this.weight,
      this.category,
      this.startsAt,
      this.bid,
      this.createdAt,
      this.checksum,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched flight draft in status created. */
export function newBatchedFlightDraft(code: string, title: string): BatchedFlightDraft {
  return new BatchedFlightDraft(code, title, "", 0, 0, "", 0, 0, 0, "", "", "created");
}
