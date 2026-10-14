/**
 * The mention target records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention target is in its life cycle. */
export type MentionTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a mention target and its current status. */
export class MentionTarget {
  code: string;
  title: string;
  budget: number;
  clicks: number;
  retries: number;
  openRate: number;
  phone: string;
  graceDays: number;
  channel: string;
  status: MentionTargetStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    clicks: number,
    retries: number,
    openRate: number,
    phone: string,
    graceDays: number,
    channel: string,
    status: MentionTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.clicks = clicks;
    this.retries = retries;
    this.openRate = openRate;
    this.phone = phone;
    this.graceDays = graceDays;
    this.channel = channel;
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

  canMoveTo(next: MentionTargetStatus): boolean {
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
          case "suspended":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: MentionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.retries + this.graceDays) * 100) / 100;
  }

  copy(): MentionTarget {
    return new MentionTarget(
      this.code,
      this.title,
      this.budget,
      this.clicks,
      this.retries,
      this.openRate,
      this.phone,
      this.graceDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention target in status draft. */
export function newMentionTarget(code: string, title: string): MentionTarget {
  return new MentionTarget(code, title, 0, 0, 0, 0, "", 0, "", "draft");
}
