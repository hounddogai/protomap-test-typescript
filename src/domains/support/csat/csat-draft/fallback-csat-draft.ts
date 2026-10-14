/**
 * The fallback csat draft records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback csat draft is in its life cycle. */
export type FallbackCsatDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback csat draft and its current status. */
export class FallbackCsatDraft {
  code: string;
  name: string;
  sendAt: number;
  capacity: number;
  priority: number;
  status: FallbackCsatDraftStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    capacity: number,
    priority: number,
    status: FallbackCsatDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.capacity = capacity;
    this.priority = priority;
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

  canMoveTo(next: FallbackCsatDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCsatDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback csat draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.priority - this.sendAt) * 100) / 100;
  }

  copy(): FallbackCsatDraft {
    return new FallbackCsatDraft(this.code, this.name, this.sendAt, this.capacity, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback csat draft in status requested. */
export function newFallbackCsatDraft(code: string, name: string): FallbackCsatDraft {
  return new FallbackCsatDraft(code, name, 0, 0, 0, "requested");
}
