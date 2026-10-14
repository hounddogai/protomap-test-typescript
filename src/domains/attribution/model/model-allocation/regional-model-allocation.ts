/**
 * The regional model allocation records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional model allocation is in its life cycle. */
export type RegionalModelAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional model allocation. Its code is unique within a tenant. */
export class RegionalModelAllocation {
  code: string;
  label: string;
  category: string;
  utmSource: string;
  timezone: string;
  pinned: boolean;
  description: string;
  quantity: number;
  openRate: number;
  status: RegionalModelAllocationStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    utmSource: string,
    timezone: string,
    pinned: boolean,
    description: string,
    quantity: number,
    openRate: number,
    status: RegionalModelAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.utmSource = utmSource;
    this.timezone = timezone;
    this.pinned = pinned;
    this.description = description;
    this.quantity = quantity;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalModelAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalModelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.quantity - this.openRate) * 100) / 100;
  }

  copy(): RegionalModelAllocation {
    return new RegionalModelAllocation(
      this.code,
      this.label,
      this.category,
      this.utmSource,
      this.timezone,
      this.pinned,
      this.description,
      this.quantity,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional model allocation in status requested. */
export function newRegionalModelAllocation(code: string, label: string): RegionalModelAllocation {
  return new RegionalModelAllocation(code, label, "", "", "", false, "", 0, 0, "requested");
}
