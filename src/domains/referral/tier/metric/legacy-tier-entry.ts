import * as text from "../../../../kit/text.js";

/** Where a legacy tier entry is in its life cycle. */
export type LegacyTierEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One legacy tier entry, with what the planners need to act on it. */
export class LegacyTierEntry {
  code: string;
  title: string;
  floorValue: number;
  startsAt: number;
  unit: string;
  ratio: number;
  description: string;
  endsAt: number;
  status: LegacyTierEntryStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    startsAt: number,
    unit: string,
    ratio: number,
    description: string,
    endsAt: number,
    status: LegacyTierEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.startsAt = startsAt;
    this.unit = unit;
    this.ratio = ratio;
    this.description = description;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTierEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTierEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy tier entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round((this.startsAt + this.ratio) * 100) / 100;
  }

  copy(): LegacyTierEntry {
    return new LegacyTierEntry(
      this.code,
      this.title,
      this.floorValue,
      this.startsAt,
      this.unit,
      this.ratio,
      this.description,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy tier entry in status planned. */
export function newLegacyTierEntry(code: string, title: string): LegacyTierEntry {
  return new LegacyTierEntry(code, title, 0, 0, "", 0, "", 0, "planned");
}
