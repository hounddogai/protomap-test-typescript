/**
 * The strict reply proposal records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reply proposal is in its life cycle. */
export type StrictReplyProposalStatus = "created" | "validated" | "published" | "retired";

/** One strict reply proposal, with what the planners need to act on it. */
export class StrictReplyProposal {
  code: string;
  title: string;
  windowDays: number;
  segment: string;
  attributes: Map<string, string>;
  sequence: number;
  unit: string;
  limit: number;
  sendAt: number;
  conversionRate: number;
  pinned: boolean;
  status: StrictReplyProposalStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    segment: string,
    attributes: Map<string, string>,
    sequence: number,
    unit: string,
    limit: number,
    sendAt: number,
    conversionRate: number,
    pinned: boolean,
    status: StrictReplyProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.segment = segment;
    this.attributes = attributes;
    this.sequence = sequence;
    this.unit = unit;
    this.limit = limit;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
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

  canMoveTo(next: StrictReplyProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictReplyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reply proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round(this.limit * this.sequence * 100) / 100;
  }

  copy(): StrictReplyProposal {
    return new StrictReplyProposal(
      this.code,
      this.title,
      this.windowDays,
      this.segment,
      this.attributes,
      this.sequence,
      this.unit,
      this.limit,
      this.sendAt,
      this.conversionRate,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict reply proposal in status created. */
export function newStrictReplyProposal(code: string, title: string): StrictReplyProposal {
  return new StrictReplyProposal(code, title, 0, "", new Map<string, string>(), 0, "", 0, 0, 0, false, "created");
}
