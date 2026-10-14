import * as text from "../../../../kit/text.js";

/** Where a regional tier slot is in its life cycle. */
export type RegionalTierSlotStatus = "created" | "validated" | "published" | "retired";

/** A regional tier slot as the tier team keeps it. */
export class RegionalTierSlot {
  code: string;
  name: string;
  version: number;
  sendAt: number;
  pinned: boolean;
  summary: string;
  country: string;
  notes: string;
  phone: string;
  unit: string;
  status: RegionalTierSlotStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    sendAt: number,
    pinned: boolean,
    summary: string,
    country: string,
    notes: string,
    phone: string,
    unit: string,
    status: RegionalTierSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.sendAt = sendAt;
    this.pinned = pinned;
    this.summary = summary;
    this.country = country;
    this.notes = notes;
    this.phone = phone;
    this.unit = unit;
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

  canMoveTo(next: RegionalTierSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalTierSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional tier slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round(this.sendAt * this.version * 100) / 100;
  }

  copy(): RegionalTierSlot {
    return new RegionalTierSlot(
      this.code,
      this.name,
      this.version,
      this.sendAt,
      this.pinned,
      this.summary,
      this.country,
      this.notes,
      this.phone,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional tier slot in status created. */
export function newRegionalTierSlot(code: string, name: string): RegionalTierSlot {
  return new RegionalTierSlot(code, name, 0, 0, false, "", "", "", "", "", "created");
}
