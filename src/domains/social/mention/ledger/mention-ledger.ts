/**
 * The mention ledger records of social's mention work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention ledger is in its life cycle. */
export type MentionLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a mention ledger and its current status. */
export class MentionLedger {
  code: string;
  name: string;
  updatedAt: number;
  ceiling: number;
  archived: boolean;
  threshold: number;
  minimum: number;
  version: number;
  utmSource: string;
  revision: number;
  status: MentionLedgerStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    ceiling: number,
    archived: boolean,
    threshold: number,
    minimum: number,
    version: number,
    utmSource: string,
    revision: number,
    status: MentionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.archived = archived;
    this.threshold = threshold;
    this.minimum = minimum;
    this.version = version;
    this.utmSource = utmSource;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.threshold + this.updatedAt) * 100) / 100;
  }

  copy(): MentionLedger {
    return new MentionLedger(
      this.code,
      this.name,
      this.updatedAt,
      this.ceiling,
      this.archived,
      this.threshold,
      this.minimum,
      this.version,
      this.utmSource,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a mention ledger in status idle. */
export function newMentionLedger(code: string, name: string): MentionLedger {
  return new MentionLedger(code, name, 0, 0, false, 0, 0, 0, "", 0, "idle");
}
