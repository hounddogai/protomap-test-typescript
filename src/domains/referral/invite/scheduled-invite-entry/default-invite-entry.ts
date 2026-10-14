/**
 * The default invite entry records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default invite entry is in its life cycle. */
export type DefaultInviteEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default invite entry as the invite team keeps it. */
export class DefaultInviteEntry {
  code: string;
  name: string;
  margin: number;
  pinned: boolean;
  checksum: string;
  phone: string;
  floorValue: number;
  status: DefaultInviteEntryStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    pinned: boolean,
    checksum: string,
    phone: string,
    floorValue: number,
    status: DefaultInviteEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.pinned = pinned;
    this.checksum = checksum;
    this.phone = phone;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultInviteEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultInviteEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default invite entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.floorValue - this.margin) * 100) / 100;
  }

  copy(): DefaultInviteEntry {
    return new DefaultInviteEntry(
      this.code,
      this.name,
      this.margin,
      this.pinned,
      this.checksum,
      this.phone,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default invite entry in status new. */
export function newDefaultInviteEntry(code: string, name: string): DefaultInviteEntry {
  return new DefaultInviteEntry(code, name, 0, false, "", "", 0, "new");
}
