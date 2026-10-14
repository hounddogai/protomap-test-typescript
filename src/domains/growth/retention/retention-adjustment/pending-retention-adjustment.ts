/**
 * The pending retention adjustment records of growth's retention work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending retention adjustment is in its life cycle. */
export type PendingRetentionAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a pending retention adjustment and its current status. */
export class PendingRetentionAdjustment {
  code: string;
  title: string;
  visible: boolean;
  pinned: boolean;
  createdAt: number;
  cost: number;
  status: PendingRetentionAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    pinned: boolean,
    createdAt: number,
    cost: number,
    status: PendingRetentionAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.cost = cost;
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

  canMoveTo(next: PendingRetentionAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: PendingRetentionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending retention adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pending retention adjustment"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.cost - this.createdAt) * 100) / 100;
  }

  copy(): PendingRetentionAdjustment {
    return new PendingRetentionAdjustment(
      this.code,
      this.title,
      this.visible,
      this.pinned,
      this.createdAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending retention adjustment in status requested. */
export function newPendingRetentionAdjustment(code: string, title: string): PendingRetentionAdjustment {
  return new PendingRetentionAdjustment(code, title, false, false, 0, 0, "requested");
}
