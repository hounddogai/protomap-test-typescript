import * as text from "../../../../kit/text.js";

/** Where a invite estimate is in its life cycle. */
export type InviteEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A invite estimate as the invite team keeps it. */
export class InviteEstimate {
  code: string;
  label: string;
  windowDays: number;
  bid: number;
  externalRef: string;
  expiresAt: number;
  segment: string;
  ownerId: string;
  graceDays: number;
  discount: number;
  status: InviteEstimateStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    bid: number,
    externalRef: string,
    expiresAt: number,
    segment: string,
    ownerId: string,
    graceDays: number,
    discount: number,
    status: InviteEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.bid = bid;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.segment = segment;
    this.ownerId = ownerId;
    this.graceDays = graceDays;
    this.discount = discount;
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

  canMoveTo(next: InviteEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.graceDays * this.bid * 100) / 100;
  }

  copy(): InviteEstimate {
    return new InviteEstimate(
      this.code,
      this.label,
      this.windowDays,
      this.bid,
      this.externalRef,
      this.expiresAt,
      this.segment,
      this.ownerId,
      this.graceDays,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite estimate in status draft. */
export function newInviteEstimate(code: string, label: string): InviteEstimate {
  return new InviteEstimate(code, label, 0, 0, "", 0, "", "", 0, 0, "draft");
}
