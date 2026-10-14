import * as text from "../../../../kit/text.js";

/** Where a mention slot is in its life cycle. */
export type MentionSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a mention slot and its current status. */
export class MentionSlot {
  code: string;
  label: string;
  version: number;
  tags: string[];
  capacity: number;
  visible: boolean;
  unit: string;
  country: string;
  durationMinutes: number;
  minimum: number;
  clicks: number;
  status: MentionSlotStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    tags: string[],
    capacity: number,
    visible: boolean,
    unit: string,
    country: string,
    durationMinutes: number,
    minimum: number,
    clicks: number,
    status: MentionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.tags = tags;
    this.capacity = capacity;
    this.visible = visible;
    this.unit = unit;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.clicks = clicks;
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

  canMoveTo(next: MentionSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "failed";
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

  moveTo(next: MentionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.minimum + this.version) * 100) / 100;
  }

  copy(): MentionSlot {
    return new MentionSlot(
      this.code,
      this.label,
      this.version,
      this.tags,
      this.capacity,
      this.visible,
      this.unit,
      this.country,
      this.durationMinutes,
      this.minimum,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a mention slot in status new. */
export function newMentionSlot(code: string, label: string): MentionSlot {
  return new MentionSlot(code, label, 0, [], 0, false, "", "", 0, 0, 0, "new");
}
