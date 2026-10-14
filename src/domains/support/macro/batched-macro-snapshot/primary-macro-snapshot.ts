/**
 * The primary macro snapshot records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary macro snapshot is in its life cycle. */
export type PrimaryMacroSnapshotStatus = "created" | "validated" | "published" | "retired";

/** One primary macro snapshot, with what the planners need to act on it. */
export class PrimaryMacroSnapshot {
  code: string;
  name: string;
  source: string;
  tags: string[];
  locale: string;
  quantity: number;
  status: PrimaryMacroSnapshotStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    tags: string[],
    locale: string,
    quantity: number,
    status: PrimaryMacroSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.tags = tags;
    this.locale = locale;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryMacroSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryMacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): PrimaryMacroSnapshot {
    return new PrimaryMacroSnapshot(
      this.code,
      this.name,
      this.source,
      this.tags,
      this.locale,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary macro snapshot in status created. */
export function newPrimaryMacroSnapshot(code: string, name: string): PrimaryMacroSnapshot {
  return new PrimaryMacroSnapshot(code, name, "", [], "", 0, "created");
}
