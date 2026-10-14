import * as text from "../../../../kit/text.js";

/** Where a touchpoint ledger is in its life cycle. */
export type TouchpointLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A touchpoint ledger. Its code is unique within a tenant. */
export class TouchpointLedger {
  code: string;
  title: string;
  checksum: string;
  conversionRate: number;
  discount: number;
  score: number;
  currency: string;
  capacity: number;
  limit: number;
  archived: boolean;
  pinned: boolean;
  status: TouchpointLedgerStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    conversionRate: number,
    discount: number,
    score: number,
    currency: string,
    capacity: number,
    limit: number,
    archived: boolean,
    pinned: boolean,
    status: TouchpointLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.score = score;
    this.currency = currency;
    this.capacity = capacity;
    this.limit = limit;
    this.archived = archived;
    this.pinned = pinned;
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

  canMoveTo(next: TouchpointLedgerStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TouchpointLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.discount - this.limit) * 100) / 100;
  }

  copy(): TouchpointLedger {
    return new TouchpointLedger(
      this.code,
      this.title,
      this.checksum,
      this.conversionRate,
      this.discount,
      this.score,
      this.currency,
      this.capacity,
      this.limit,
      this.archived,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a touchpoint ledger in status requested. */
export function newTouchpointLedger(code: string, title: string): TouchpointLedger {
  return new TouchpointLedger(code, title, "", 0, 0, 0, "", 0, 0, false, false, "requested");
}
