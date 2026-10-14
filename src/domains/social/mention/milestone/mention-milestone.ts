/**
 * The mention milestone records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention milestone is in its life cycle. */
export type MentionMilestoneStatus = "created" | "validated" | "published" | "retired";

/** The record of a mention milestone and its current status. */
export class MentionMilestone {
  code: string;
  label: string;
  sequence: number;
  amount: number;
  attributes: Map<string, string>;
  sendAt: number;
  status: MentionMilestoneStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    amount: number,
    attributes: Map<string, string>,
    sendAt: number,
    status: MentionMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.amount = amount;
    this.attributes = attributes;
    this.sendAt = sendAt;
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

  canMoveTo(next: MentionMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MentionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.amount + this.sequence) * 100) / 100;
  }

  copy(): MentionMilestone {
    return new MentionMilestone(
      this.code,
      this.label,
      this.sequence,
      this.amount,
      this.attributes,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a mention milestone in status created. */
export function newMentionMilestone(code: string, label: string): MentionMilestone {
  return new MentionMilestone(code, label, 0, 0, new Map<string, string>(), 0, "created");
}
