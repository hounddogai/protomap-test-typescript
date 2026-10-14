import * as text from "../../../../kit/text.js";

/** Where a level entry is in its life cycle. */
export type LevelEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A level entry. Its code is unique within a tenant. */
export class LevelEntry {
  code: string;
  label: string;
  frequencyCap: number;
  archived: boolean;
  rate: number;
  unit: string;
  updatedAt: number;
  title: string;
  openRate: number;
  maximum: number;
  checksum: string;
  status: LevelEntryStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    archived: boolean,
    rate: number,
    unit: string,
    updatedAt: number,
    title: string,
    openRate: number,
    maximum: number,
    checksum: string,
    status: LevelEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.rate = rate;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.title = title;
    this.openRate = openRate;
    this.maximum = maximum;
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

  canMoveTo(next: LevelEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"level entry"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum + this.frequencyCap) * 100) / 100;
  }

  copy(): LevelEntry {
    return new LevelEntry(
      this.code,
      this.label,
      this.frequencyCap,
      this.archived,
      this.rate,
      this.unit,
      this.updatedAt,
      this.title,
      this.openRate,
      this.maximum,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level entry in status open. */
export function newLevelEntry(code: string, label: string): LevelEntry {
  return new LevelEntry(code, label, 0, false, 0, "", 0, "", 0, 0, "", "open");
}
