import * as text from "../../../../kit/text.js";

/** Where a streak entry is in its life cycle. */
export type StreakEntryStatus = "created" | "validated" | "published" | "retired";

/** One streak entry, with what the planners need to act on it. */
export class StreakEntry {
  code: string;
  label: string;
  name: string;
  segment: string;
  checksum: string;
  archived: boolean;
  openRate: number;
  status: StreakEntryStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    segment: string,
    checksum: string,
    archived: boolean,
    openRate: number,
    status: StreakEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.segment = segment;
    this.checksum = checksum;
    this.archived = archived;
    this.openRate = openRate;
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

  canMoveTo(next: StreakEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StreakEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"streak entry"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): StreakEntry {
    return new StreakEntry(
      this.code,
      this.label,
      this.name,
      this.segment,
      this.checksum,
      this.archived,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a streak entry in status created. */
export function newStreakEntry(code: string, label: string): StreakEntry {
  return new StreakEntry(code, label, "", "", "", false, 0, "created");
}
