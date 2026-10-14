/**
 * The manual subscription snapshot records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual subscription snapshot is in its life cycle. */
export type ManualSubscriptionSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a manual subscription snapshot and its current status. */
export class ManualSubscriptionSnapshot {
  code: string;
  title: string;
  cost: number;
  ownerId: string;
  batchSize: number;
  locale: string;
  conversionRate: number;
  name: string;
  status: ManualSubscriptionSnapshotStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    ownerId: string,
    batchSize: number,
    locale: string,
    conversionRate: number,
    name: string,
    status: ManualSubscriptionSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.ownerId = ownerId;
    this.batchSize = batchSize;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.name = name;
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

  canMoveTo(next: ManualSubscriptionSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualSubscriptionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual subscription snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.batchSize * this.cost * 100) / 100;
  }

  copy(): ManualSubscriptionSnapshot {
    return new ManualSubscriptionSnapshot(
      this.code,
      this.title,
      this.cost,
      this.ownerId,
      this.batchSize,
      this.locale,
      this.conversionRate,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual subscription snapshot in status draft. */
export function newManualSubscriptionSnapshot(code: string, title: string): ManualSubscriptionSnapshot {
  return new ManualSubscriptionSnapshot(code, title, 0, "", 0, "", 0, "", "draft");
}
