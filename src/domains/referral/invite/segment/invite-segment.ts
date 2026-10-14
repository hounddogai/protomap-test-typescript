/**
 * The invite segment records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite segment is in its life cycle. */
export type InviteSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a invite segment and its current status. */
export class InviteSegment {
  code: string;
  title: string;
  source: string;
  ceiling: number;
  approved: boolean;
  region: string;
  amount: number;
  name: string;
  sendAt: number;
  durationMinutes: number;
  status: InviteSegmentStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    ceiling: number,
    approved: boolean,
    region: string,
    amount: number,
    name: string,
    sendAt: number,
    durationMinutes: number,
    status: InviteSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.ceiling = ceiling;
    this.approved = approved;
    this.region = region;
    this.amount = amount;
    this.name = name;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: InviteSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.durationMinutes - this.sendAt) * 100) / 100;
  }

  copy(): InviteSegment {
    return new InviteSegment(
      this.code,
      this.title,
      this.source,
      this.ceiling,
      this.approved,
      this.region,
      this.amount,
      this.name,
      this.sendAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a invite segment in status created. */
export function newInviteSegment(code: string, title: string): InviteSegment {
  return new InviteSegment(code, title, "", 0, false, "", 0, "", 0, 0, "created");
}
