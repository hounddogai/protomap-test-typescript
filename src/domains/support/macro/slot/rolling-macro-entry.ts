import * as text from "../../../../kit/text.js";

/** Where a rolling macro entry is in its life cycle. */
export type RollingMacroEntryStatus = "created" | "validated" | "published" | "retired";

/** One rolling macro entry, with what the planners need to act on it. */
export class RollingMacroEntry {
  code: string;
  label: string;
  tags: string[];
  clicks: number;
  threshold: number;
  pinned: boolean;
  priority: number;
  floorValue: number;
  status: RollingMacroEntryStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    clicks: number,
    threshold: number,
    pinned: boolean,
    priority: number,
    floorValue: number,
    status: RollingMacroEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.clicks = clicks;
    this.threshold = threshold;
    this.pinned = pinned;
    this.priority = priority;
    this.floorValue = floorValue;
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

  canMoveTo(next: RollingMacroEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
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

  moveTo(next: RollingMacroEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling macro entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.floorValue - this.priority) * 100) / 100;
  }

  copy(): RollingMacroEntry {
    return new RollingMacroEntry(
      this.code,
      this.label,
      this.tags,
      this.clicks,
      this.threshold,
      this.pinned,
      this.priority,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling macro entry in status created. */
export function newRollingMacroEntry(code: string, label: string): RollingMacroEntry {
  return new RollingMacroEntry(code, label, [], 0, 0, false, 0, 0, "created");
}
