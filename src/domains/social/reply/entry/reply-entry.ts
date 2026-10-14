/**
 * The reply entry records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply entry is in its life cycle. */
export type ReplyEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reply entry, with what the planners need to act on it. */
export class ReplyEntry {
  code: string;
  label: string;
  impressions: number;
  approved: boolean;
  channel: string;
  quantity: number;
  active: boolean;
  score: number;
  attributes: Map<string, string>;
  checksum: string;
  endsAt: number;
  status: ReplyEntryStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    approved: boolean,
    channel: string,
    quantity: number,
    active: boolean,
    score: number,
    attributes: Map<string, string>,
    checksum: string,
    endsAt: number,
    status: ReplyEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.approved = approved;
    this.channel = channel;
    this.quantity = quantity;
    this.active = active;
    this.score = score;
    this.attributes = attributes;
    this.checksum = checksum;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReplyEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reply entry"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity + this.impressions) * 100) / 100;
  }

  copy(): ReplyEntry {
    return new ReplyEntry(
      this.code,
      this.label,
      this.impressions,
      this.approved,
      this.channel,
      this.quantity,
      this.active,
      this.score,
      this.attributes,
      this.checksum,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reply entry in status proposed. */
export function newReplyEntry(code: string, label: string): ReplyEntry {
  return new ReplyEntry(code, label, 0, false, "", 0, false, 0, new Map<string, string>(), "", 0, "proposed");
}
