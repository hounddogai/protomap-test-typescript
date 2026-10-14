import * as text from "../../../../kit/text.js";

/** Where a tier slot is in its life cycle. */
export type TierSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tier slot and its current status. */
export class TierSlot {
  code: string;
  label: string;
  timezone: string;
  revision: number;
  ceiling: number;
  title: string;
  weight: number;
  status: TierSlotStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    revision: number,
    ceiling: number,
    title: string,
    weight: number,
    status: TierSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.revision = revision;
    this.ceiling = ceiling;
    this.title = title;
    this.weight = weight;
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

  canMoveTo(next: TierSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TierSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.ceiling - this.revision) * 100) / 100;
  }

  copy(): TierSlot {
    return new TierSlot(
      this.code,
      this.label,
      this.timezone,
      this.revision,
      this.ceiling,
      this.title,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier slot in status planned. */
export function newTierSlot(code: string, label: string): TierSlot {
  return new TierSlot(code, label, "", 0, 0, "", 0, "planned");
}
