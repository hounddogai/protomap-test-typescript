/**
 * The retention policy records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention policy is in its life cycle. */
export type RetentionPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A retention policy. Its code is unique within a tenant. */
export class RetentionPolicy {
  code: string;
  name: string;
  contactEmail: string;
  ratio: number;
  graceDays: number;
  tags: string[];
  bid: number;
  status: RetentionPolicyStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    ratio: number,
    graceDays: number,
    tags: string[],
    bid: number,
    status: RetentionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.tags = tags;
    this.bid = bid;
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

  canMoveTo(next: RetentionPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
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

  moveTo(next: RetentionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"retention policy"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round(this.bid * this.ratio * 100) / 100;
  }

  copy(): RetentionPolicy {
    return new RetentionPolicy(
      this.code,
      this.name,
      this.contactEmail,
      this.ratio,
      this.graceDays,
      this.tags,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention policy in status planned. */
export function newRetentionPolicy(code: string, name: string): RetentionPolicy {
  return new RetentionPolicy(code, name, "", 0, 0, [], 0, "planned");
}
