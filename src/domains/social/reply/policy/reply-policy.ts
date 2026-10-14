/**
 * The reply policy records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply policy is in its life cycle. */
export type ReplyPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reply policy and its current status. */
export class ReplyPolicy {
  code: string;
  name: string;
  label: string;
  retries: number;
  amount: number;
  title: string;
  rate: number;
  budget: number;
  attempts: number;
  active: boolean;
  status: ReplyPolicyStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    retries: number,
    amount: number,
    title: string,
    rate: number,
    budget: number,
    attempts: number,
    active: boolean,
    status: ReplyPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.retries = retries;
    this.amount = amount;
    this.title = title;
    this.rate = rate;
    this.budget = budget;
    this.attempts = attempts;
    this.active = active;
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

  canMoveTo(next: ReplyPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): ReplyPolicy {
    return new ReplyPolicy(
      this.code,
      this.name,
      this.label,
      this.retries,
      this.amount,
      this.title,
      this.rate,
      this.budget,
      this.attempts,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reply policy in status planned. */
export function newReplyPolicy(code: string, name: string): ReplyPolicy {
  return new ReplyPolicy(code, name, "", 0, 0, "", 0, 0, 0, false, "planned");
}
