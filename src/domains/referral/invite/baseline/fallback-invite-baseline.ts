/**
 * The fallback invite baseline records of referral's invite work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback invite baseline is in its life cycle. */
export type FallbackInviteBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback invite baseline and its current status. */
export class FallbackInviteBaseline {
  code: string;
  name: string;
  windowDays: number;
  attributes: Map<string, string>;
  active: boolean;
  checksum: string;
  phone: string;
  contactEmail: string;
  margin: number;
  capacity: number;
  channel: string;
  status: FallbackInviteBaselineStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    attributes: Map<string, string>,
    active: boolean,
    checksum: string,
    phone: string,
    contactEmail: string,
    margin: number,
    capacity: number,
    channel: string,
    status: FallbackInviteBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.active = active;
    this.checksum = checksum;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.capacity = capacity;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackInviteBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackInviteBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback invite baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.windowDays * this.capacity * 100) / 100;
  }

  copy(): FallbackInviteBaseline {
    return new FallbackInviteBaseline(
      this.code,
      this.name,
      this.windowDays,
      this.attributes,
      this.active,
      this.checksum,
      this.phone,
      this.contactEmail,
      this.margin,
      this.capacity,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback invite baseline in status open. */
export function newFallbackInviteBaseline(code: string, name: string): FallbackInviteBaseline {
  return new FallbackInviteBaseline(code, name, 0, new Map<string, string>(), false, "", "", "", 0, 0, "", "open");
}
