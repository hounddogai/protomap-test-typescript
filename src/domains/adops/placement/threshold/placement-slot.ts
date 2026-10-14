import * as text from "../../../../kit/text.js";

/** Where a placement slot is in its life cycle. */
export type PlacementSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a placement slot and its current status. */
export class PlacementSlot {
  code: string;
  name: string;
  phone: string;
  openRate: number;
  batchSize: number;
  notes: string;
  attributes: Map<string, string>;
  status: PlacementSlotStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    openRate: number,
    batchSize: number,
    notes: string,
    attributes: Map<string, string>,
    status: PlacementSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.openRate = openRate;
    this.batchSize = batchSize;
    this.notes = notes;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.openRate + this.batchSize) * 100) / 100;
  }

  copy(): PlacementSlot {
    return new PlacementSlot(
      this.code,
      this.name,
      this.phone,
      this.openRate,
      this.batchSize,
      this.notes,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a placement slot in status draft. */
export function newPlacementSlot(code: string, name: string): PlacementSlot {
  return new PlacementSlot(code, name, "", 0, 0, "", new Map<string, string>(), "draft");
}
