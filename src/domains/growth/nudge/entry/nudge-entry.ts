/**
 * The nudge entry records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge entry is in its life cycle. */
export type NudgeEntryStatus = "created" | "validated" | "published" | "retired";

/** A nudge entry as the nudge team keeps it. */
export class NudgeEntry {
  code: string;
  title: string;
  revision: number;
  segment: string;
  limit: number;
  utmSource: string;
  externalRef: string;
  score: number;
  active: boolean;
  checksum: string;
  status: NudgeEntryStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    segment: string,
    limit: number,
    utmSource: string,
    externalRef: string,
    score: number,
    active: boolean,
    checksum: string,
    status: NudgeEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.segment = segment;
    this.limit = limit;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.score = score;
    this.active = active;
    this.checksum = checksum;
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

  canMoveTo(next: NudgeEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.score - this.revision) * 100) / 100;
  }

  copy(): NudgeEntry {
    return new NudgeEntry(
      this.code,
      this.title,
      this.revision,
      this.segment,
      this.limit,
      this.utmSource,
      this.externalRef,
      this.score,
      this.active,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a nudge entry in status created. */
export function newNudgeEntry(code: string, title: string): NudgeEntry {
  return new NudgeEntry(code, title, 0, "", 0, "", "", 0, false, "", "created");
}
