/**
 * The sender group records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender group is in its life cycle. */
export type SenderGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One sender group, with what the planners need to act on it. */
export class SenderGroup {
  code: string;
  name: string;
  updatedAt: number;
  variant: string;
  source: string;
  capacity: number;
  status: SenderGroupStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    variant: string,
    source: string,
    capacity: number,
    status: SenderGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.source = source;
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

  canMoveTo(next: SenderGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: SenderGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt + this.capacity) * 100) / 100;
  }

  copy(): SenderGroup {
    return new SenderGroup(this.code, this.name, this.updatedAt, this.variant, this.source, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a sender group in status planned. */
export function newSenderGroup(code: string, name: string): SenderGroup {
  return new SenderGroup(code, name, 0, "", "", 0, "planned");
}
