/**
 * The macro snapshot records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro snapshot is in its life cycle. */
export type MacroSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a macro snapshot and its current status. */
export class MacroSnapshot {
  code: string;
  title: string;
  batchSize: number;
  maximum: number;
  attributes: Map<string, string>;
  attempts: number;
  ownerId: string;
  utmSource: string;
  country: string;
  version: number;
  sequence: number;
  status: MacroSnapshotStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    maximum: number,
    attributes: Map<string, string>,
    attempts: number,
    ownerId: string,
    utmSource: string,
    country: string,
    version: number,
    sequence: number,
    status: MacroSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.attributes = attributes;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.country = country;
    this.version = version;
    this.sequence = sequence;
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

  canMoveTo(next: MacroSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: MacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"macro snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.version - this.sequence) * 100) / 100;
  }

  copy(): MacroSnapshot {
    return new MacroSnapshot(
      this.code,
      this.title,
      this.batchSize,
      this.maximum,
      this.attributes,
      this.attempts,
      this.ownerId,
      this.utmSource,
      this.country,
      this.version,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a macro snapshot in status new. */
export function newMacroSnapshot(code: string, title: string): MacroSnapshot {
  return new MacroSnapshot(code, title, 0, 0, new Map<string, string>(), 0, "", "", "", 0, 0, "new");
}
