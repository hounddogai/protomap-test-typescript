import * as text from "../../../../kit/text.js";

/** Where a strict path entry is in its life cycle. */
export type StrictPathEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict path entry and its current status. */
export class StrictPathEntry {
  code: string;
  title: string;
  threshold: number;
  archived: boolean;
  batchSize: number;
  updatedAt: number;
  status: StrictPathEntryStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    archived: boolean,
    batchSize: number,
    updatedAt: number,
    status: StrictPathEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.archived = archived;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPathEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictPathEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict path entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round((this.threshold + this.batchSize) * 100) / 100;
  }

  copy(): StrictPathEntry {
    return new StrictPathEntry(
      this.code,
      this.title,
      this.threshold,
      this.archived,
      this.batchSize,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict path entry in status proposed. */
export function newStrictPathEntry(code: string, title: string): StrictPathEntry {
  return new StrictPathEntry(code, title, 0, false, 0, 0, "proposed");
}
