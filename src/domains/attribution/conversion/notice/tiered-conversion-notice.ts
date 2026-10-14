/**
 * The tiered conversion notice records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered conversion notice is in its life cycle. */
export type TieredConversionNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered conversion notice as the conversion team keeps it. */
export class TieredConversionNotice {
  code: string;
  label: string;
  startsAt: number;
  version: number;
  reviewer: string;
  discount: number;
  cost: number;
  floorValue: number;
  updatedAt: number;
  campaignRef: string;
  status: TieredConversionNoticeStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    version: number,
    reviewer: string,
    discount: number,
    cost: number,
    floorValue: number,
    updatedAt: number,
    campaignRef: string,
    status: TieredConversionNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.version = version;
    this.reviewer = reviewer;
    this.discount = discount;
    this.cost = cost;
    this.floorValue = floorValue;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: TieredConversionNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredConversionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered conversion notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.updatedAt - this.discount) * 100) / 100;
  }

  copy(): TieredConversionNotice {
    return new TieredConversionNotice(
      this.code,
      this.label,
      this.startsAt,
      this.version,
      this.reviewer,
      this.discount,
      this.cost,
      this.floorValue,
      this.updatedAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered conversion notice in status draft. */
export function newTieredConversionNotice(code: string, label: string): TieredConversionNotice {
  return new TieredConversionNotice(code, label, 0, 0, "", 0, 0, 0, 0, "", "draft");
}
