import * as text from "../../../../kit/text.js";

/** Where a weighted placement slot is in its life cycle. */
export type WeightedPlacementSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted placement slot. Its code is unique within a tenant. */
export class WeightedPlacementSlot {
  code: string;
  label: string;
  phone: string;
  archived: boolean;
  checksum: string;
  conversionRate: number;
  tags: string[];
  locale: string;
  channel: string;
  status: WeightedPlacementSlotStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    archived: boolean,
    checksum: string,
    conversionRate: number,
    tags: string[],
    locale: string,
    channel: string,
    status: WeightedPlacementSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.archived = archived;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.tags = tags;
    this.locale = locale;
    this.channel = channel;
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

  canMoveTo(next: WeightedPlacementSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted placement slot"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): WeightedPlacementSlot {
    return new WeightedPlacementSlot(
      this.code,
      this.label,
      this.phone,
      this.archived,
      this.checksum,
      this.conversionRate,
      this.tags,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted placement slot in status new. */
export function newWeightedPlacementSlot(code: string, label: string): WeightedPlacementSlot {
  return new WeightedPlacementSlot(code, label, "", false, "", 0, [], "", "", "new");
}
