/**
 * The invite quota records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite quota is in its life cycle. */
export type InviteQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a invite quota and its current status. */
export class InviteQuota {
  code: string;
  title: string;
  reviewer: string;
  contactEmail: string;
  floorValue: number;
  status: InviteQuotaStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    contactEmail: string,
    floorValue: number,
    status: InviteQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): InviteQuota {
    return new InviteQuota(this.code, this.title, this.reviewer, this.contactEmail, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite quota in status planned. */
export function newInviteQuota(code: string, title: string): InviteQuota {
  return new InviteQuota(code, title, "", "", 0, "planned");
}
