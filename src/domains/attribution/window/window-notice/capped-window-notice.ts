/**
 * The capped window notice records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped window notice is in its life cycle. */
export type CappedWindowNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped window notice as the window team keeps it. */
export class CappedWindowNotice {
  code: string;
  label: string;
  version: number;
  category: string;
  title: string;
  status: CappedWindowNoticeStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    category: string,
    title: string,
    status: CappedWindowNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.category = category;
    this.title = title;
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

  canMoveTo(next: CappedWindowNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedWindowNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped window notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): CappedWindowNotice {
    return new CappedWindowNotice(this.code, this.label, this.version, this.category, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a capped window notice in status new. */
export function newCappedWindowNotice(code: string, label: string): CappedWindowNotice {
  return new CappedWindowNotice(code, label, 0, "", "", "new");
}
