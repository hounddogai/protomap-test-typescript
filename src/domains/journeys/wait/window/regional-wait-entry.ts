import * as text from "../../../../kit/text.js";

/** Where a regional wait entry is in its life cycle. */
export type RegionalWaitEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One regional wait entry, with what the planners need to act on it. */
export class RegionalWaitEntry {
  code: string;
  label: string;
  margin: number;
  retries: number;
  ceiling: number;
  checksum: string;
  status: RegionalWaitEntryStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    retries: number,
    ceiling: number,
    checksum: string,
    status: RegionalWaitEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.retries = retries;
    this.ceiling = ceiling;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalWaitEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalWaitEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional wait entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.margin + this.retries) * 100) / 100;
  }

  copy(): RegionalWaitEntry {
    return new RegionalWaitEntry(
      this.code,
      this.label,
      this.margin,
      this.retries,
      this.ceiling,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional wait entry in status open. */
export function newRegionalWaitEntry(code: string, label: string): RegionalWaitEntry {
  return new RegionalWaitEntry(code, label, 0, 0, 0, "", "open");
}
