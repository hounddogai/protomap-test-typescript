/**
 * The primary domain schedule records of deliverability's domain work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary domain schedule is in its life cycle. */
export type PrimaryDomainScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary domain schedule. Its code is unique within a tenant. */
export class PrimaryDomainSchedule {
  code: string;
  title: string;
  channel: string;
  audienceId: string;
  amount: number;
  sequence: number;
  approved: boolean;
  status: PrimaryDomainScheduleStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    audienceId: string,
    amount: number,
    sequence: number,
    approved: boolean,
    status: PrimaryDomainScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.audienceId = audienceId;
    this.amount = amount;
    this.sequence = sequence;
    this.approved = approved;
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

  canMoveTo(next: PrimaryDomainScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PrimaryDomainScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary domain schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary domain schedule"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.amount * this.sequence * 100) / 100;
  }

  copy(): PrimaryDomainSchedule {
    return new PrimaryDomainSchedule(
      this.code,
      this.title,
      this.channel,
      this.audienceId,
      this.amount,
      this.sequence,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary domain schedule in status draft. */
export function newPrimaryDomainSchedule(code: string, title: string): PrimaryDomainSchedule {
  return new PrimaryDomainSchedule(code, title, "", "", 0, 0, false, "draft");
}
