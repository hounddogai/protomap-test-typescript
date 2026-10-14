import * as text from "../../../../kit/text.js";

/** Where a seasonal macro slot is in its life cycle. */
export type SeasonalMacroSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal macro slot. Its code is unique within a tenant. */
export class SeasonalMacroSlot {
  code: string;
  title: string;
  quantity: number;
  revision: number;
  openRate: number;
  retries: number;
  floorValue: number;
  channel: string;
  status: SeasonalMacroSlotStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    revision: number,
    openRate: number,
    retries: number,
    floorValue: number,
    channel: string,
    status: SeasonalMacroSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.revision = revision;
    this.openRate = openRate;
    this.retries = retries;
    this.floorValue = floorValue;
    this.channel = channel;
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

  canMoveTo(next: SeasonalMacroSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
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
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalMacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity - this.revision) * 100) / 100;
  }

  copy(): SeasonalMacroSlot {
    return new SeasonalMacroSlot(
      this.code,
      this.title,
      this.quantity,
      this.revision,
      this.openRate,
      this.retries,
      this.floorValue,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal macro slot in status planned. */
export function newSeasonalMacroSlot(code: string, title: string): SeasonalMacroSlot {
  return new SeasonalMacroSlot(code, title, 0, 0, 0, 0, 0, "", "planned");
}
