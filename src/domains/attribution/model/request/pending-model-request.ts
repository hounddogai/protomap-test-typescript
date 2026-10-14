/**
 * The pending model request records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending model request is in its life cycle. */
export type PendingModelRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending model request as the model team keeps it. */
export class PendingModelRequest {
  code: string;
  title: string;
  archived: boolean;
  batchSize: number;
  budget: number;
  attempts: number;
  quantity: number;
  weight: number;
  margin: number;
  currency: string;
  status: PendingModelRequestStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    batchSize: number,
    budget: number,
    attempts: number,
    quantity: number,
    weight: number,
    margin: number,
    currency: string,
    status: PendingModelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.batchSize = batchSize;
    this.budget = budget;
    this.attempts = attempts;
    this.quantity = quantity;
    this.weight = weight;
    this.margin = margin;
    this.currency = currency;
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

  canMoveTo(next: PendingModelRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingModelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending model request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending model request"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): PendingModelRequest {
    return new PendingModelRequest(
      this.code,
      this.title,
      this.archived,
      this.batchSize,
      this.budget,
      this.attempts,
      this.quantity,
      this.weight,
      this.margin,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending model request in status requested. */
export function newPendingModelRequest(code: string, title: string): PendingModelRequest {
  return new PendingModelRequest(code, title, false, 0, 0, 0, 0, 0, 0, "", "requested");
}
