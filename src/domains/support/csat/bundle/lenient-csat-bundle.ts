/**
 * The lenient csat bundle records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient csat bundle is in its life cycle. */
export type LenientCsatBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient csat bundle. Its code is unique within a tenant. */
export class LenientCsatBundle {
  code: string;
  title: string;
  endsAt: number;
  category: string;
  windowDays: number;
  batchSize: number;
  amount: number;
  weight: number;
  score: number;
  status: LenientCsatBundleStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    category: string,
    windowDays: number,
    batchSize: number,
    amount: number,
    weight: number,
    score: number,
    status: LenientCsatBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.category = category;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.amount = amount;
    this.weight = weight;
    this.score = score;
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

  canMoveTo(next: LenientCsatBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
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

  moveTo(next: LenientCsatBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient csat bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient csat bundle"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.windowDays * this.endsAt * 100) / 100;
  }

  copy(): LenientCsatBundle {
    return new LenientCsatBundle(
      this.code,
      this.title,
      this.endsAt,
      this.category,
      this.windowDays,
      this.batchSize,
      this.amount,
      this.weight,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient csat bundle in status requested. */
export function newLenientCsatBundle(code: string, title: string): LenientCsatBundle {
  return new LenientCsatBundle(code, title, 0, "", 0, 0, 0, 0, 0, "requested");
}
