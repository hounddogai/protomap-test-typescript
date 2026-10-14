import * as text from "../../../../kit/text.js";

/** Where a global flight tier is in its life cycle. */
export type GlobalFlightTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global flight tier and its current status. */
export class GlobalFlightTier {
  code: string;
  name: string;
  category: string;
  segment: string;
  floorValue: number;
  openRate: number;
  phone: string;
  checksum: string;
  sendAt: number;
  batchSize: number;
  status: GlobalFlightTierStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    segment: string,
    floorValue: number,
    openRate: number,
    phone: string,
    checksum: string,
    sendAt: number,
    batchSize: number,
    status: GlobalFlightTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.segment = segment;
    this.floorValue = floorValue;
    this.openRate = openRate;
    this.phone = phone;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
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

  canMoveTo(next: GlobalFlightTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFlightTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.openRate - this.floorValue) * 100) / 100;
  }

  copy(): GlobalFlightTier {
    return new GlobalFlightTier(
      this.code,
      this.name,
      this.category,
      this.segment,
      this.floorValue,
      this.openRate,
      this.phone,
      this.checksum,
      this.sendAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global flight tier in status draft. */
export function newGlobalFlightTier(code: string, name: string): GlobalFlightTier {
  return new GlobalFlightTier(code, name, "", "", 0, 0, "", "", 0, 0, "draft");
}
