/**
 * The invite digest records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite digest is in its life cycle. */
export type InviteDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a invite digest and its current status. */
export class InviteDigest {
  code: string;
  title: string;
  graceDays: number;
  retries: number;
  capacity: number;
  summary: string;
  checksum: string;
  status: InviteDigestStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    retries: number,
    capacity: number,
    summary: string,
    checksum: string,
    status: InviteDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.retries = retries;
    this.capacity = capacity;
    this.summary = summary;
    this.checksum = checksum;
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

  canMoveTo(next: InviteDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.retries * this.capacity * 100) / 100;
  }

  copy(): InviteDigest {
    return new InviteDigest(
      this.code,
      this.title,
      this.graceDays,
      this.retries,
      this.capacity,
      this.summary,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite digest in status requested. */
export function newInviteDigest(code: string, title: string): InviteDigest {
  return new InviteDigest(code, title, 0, 0, 0, "", "", "requested");
}
