/**
 * The mention digest records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention digest is in its life cycle. */
export type MentionDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One mention digest, with what the planners need to act on it. */
export class MentionDigest {
  code: string;
  name: string;
  timezone: string;
  segment: string;
  bid: number;
  amount: number;
  label: string;
  attributes: Map<string, string>;
  contactEmail: string;
  country: string;
  capacity: number;
  status: MentionDigestStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    segment: string,
    bid: number,
    amount: number,
    label: string,
    attributes: Map<string, string>,
    contactEmail: string,
    country: string,
    capacity: number,
    status: MentionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.segment = segment;
    this.bid = bid;
    this.amount = amount;
    this.label = label;
    this.attributes = attributes;
    this.contactEmail = contactEmail;
    this.country = country;
    this.capacity = capacity;
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

  canMoveTo(next: MentionDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
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

  moveTo(next: MentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.amount - this.capacity) * 100) / 100;
  }

  copy(): MentionDigest {
    return new MentionDigest(
      this.code,
      this.name,
      this.timezone,
      this.segment,
      this.bid,
      this.amount,
      this.label,
      this.attributes,
      this.contactEmail,
      this.country,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a mention digest in status planned. */
export function newMentionDigest(code: string, name: string): MentionDigest {
  return new MentionDigest(code, name, "", "", 0, 0, "", new Map<string, string>(), "", "", 0, "planned");
}
