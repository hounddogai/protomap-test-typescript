/**
 * The fallback ticket view slot records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback ticket view slot is in its life cycle. */
export type FallbackTicketViewSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback ticket view slot as the ticket view team keeps it. */
export class FallbackTicketViewSlot {
  code: string;
  name: string;
  approved: boolean;
  checksum: string;
  title: string;
  minimum: number;
  createdAt: number;
  windowDays: number;
  category: string;
  version: number;
  visible: boolean;
  status: FallbackTicketViewSlotStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    checksum: string,
    title: string,
    minimum: number,
    createdAt: number,
    windowDays: number,
    category: string,
    version: number,
    visible: boolean,
    status: FallbackTicketViewSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.checksum = checksum;
    this.title = title;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.windowDays = windowDays;
    this.category = category;
    this.version = version;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackTicketViewSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackTicketViewSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback ticket view slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"fallback ticket view slot"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.windowDays - this.version) * 100) / 100;
  }

  copy(): FallbackTicketViewSlot {
    return new FallbackTicketViewSlot(
      this.code,
      this.name,
      this.approved,
      this.checksum,
      this.title,
      this.minimum,
      this.createdAt,
      this.windowDays,
      this.category,
      this.version,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback ticket view slot in status requested. */
export function newFallbackTicketViewSlot(code: string, name: string): FallbackTicketViewSlot {
  return new FallbackTicketViewSlot(code, name, false, "", "", 0, 0, 0, "", 0, false, "requested");
}
