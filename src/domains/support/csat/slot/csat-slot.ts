/**
 * The csat slot records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat slot is in its life cycle. */
export type CsatSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A csat slot as the csat team keeps it. */
export class CsatSlot {
  code: string;
  name: string;
  checksum: string;
  ownerId: string;
  attributes: Map<string, string>;
  externalRef: string;
  archived: boolean;
  capacity: number;
  openRate: number;
  retries: number;
  status: CsatSlotStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    ownerId: string,
    attributes: Map<string, string>,
    externalRef: string,
    archived: boolean,
    capacity: number,
    openRate: number,
    retries: number,
    status: CsatSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.externalRef = externalRef;
    this.archived = archived;
    this.capacity = capacity;
    this.openRate = openRate;
    this.retries = retries;
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

  canMoveTo(next: CsatSlotStatus): boolean {
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
          case "in_progress":
          case "cancelled":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat slot ${this.code} cannot move from ${this.status} to ${next}`);
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
    return Math.round(this.openRate * this.capacity * 100) / 100;
  }

  copy(): CsatSlot {
    return new CsatSlot(
      this.code,
      this.name,
      this.checksum,
      this.ownerId,
      this.attributes,
      this.externalRef,
      this.archived,
      this.capacity,
      this.openRate,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat slot in status planned. */
export function newCsatSlot(code: string, name: string): CsatSlot {
  return new CsatSlot(code, name, "", "", new Map<string, string>(), "", false, 0, 0, 0, "planned");
}
