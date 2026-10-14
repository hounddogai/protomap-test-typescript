/**
 * The fallback sender profile records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback sender profile is in its life cycle. */
export type FallbackSenderProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback sender profile as the sender team keeps it. */
export class FallbackSenderProfile {
  code: string;
  label: string;
  tags: string[];
  channel: string;
  phone: string;
  amount: number;
  status: FallbackSenderProfileStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    channel: string,
    phone: string,
    amount: number,
    status: FallbackSenderProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.channel = channel;
    this.phone = phone;
    this.amount = amount;
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

  canMoveTo(next: FallbackSenderProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: FallbackSenderProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback sender profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): FallbackSenderProfile {
    return new FallbackSenderProfile(
      this.code,
      this.label,
      this.tags,
      this.channel,
      this.phone,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback sender profile in status planned. */
export function newFallbackSenderProfile(code: string, label: string): FallbackSenderProfile {
  return new FallbackSenderProfile(code, label, [], "", "", 0, "planned");
}
