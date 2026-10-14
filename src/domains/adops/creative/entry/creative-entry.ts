/**
 * The creative entry records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative entry is in its life cycle. */
export type CreativeEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative entry as the creative team keeps it. */
export class CreativeEntry {
  code: string;
  title: string;
  frequencyCap: number;
  expiresAt: number;
  source: string;
  status: CreativeEntryStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    expiresAt: number,
    source: string,
    status: CreativeEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.source = source;
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

  canMoveTo(next: CreativeEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreativeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round(this.expiresAt * this.frequencyCap * 100) / 100;
  }

  copy(): CreativeEntry {
    return new CreativeEntry(this.code, this.title, this.frequencyCap, this.expiresAt, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a creative entry in status requested. */
export function newCreativeEntry(code: string, title: string): CreativeEntry {
  return new CreativeEntry(code, title, 0, 0, "", "requested");
}
