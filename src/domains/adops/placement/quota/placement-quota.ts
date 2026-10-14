/**
 * The placement quota records of adops's placement work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement quota is in its life cycle. */
export type PlacementQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A placement quota as the placement team keeps it. */
export class PlacementQuota {
  code: string;
  name: string;
  checksum: string;
  endsAt: number;
  sendAt: number;
  label: string;
  timezone: string;
  rate: number;
  ownerId: string;
  approved: boolean;
  country: string;
  status: PlacementQuotaStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    endsAt: number,
    sendAt: number,
    label: string,
    timezone: string,
    rate: number,
    ownerId: string,
    approved: boolean,
    country: string,
    status: PlacementQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.endsAt = endsAt;
    this.sendAt = sendAt;
    this.label = label;
    this.timezone = timezone;
    this.rate = rate;
    this.ownerId = ownerId;
    this.approved = approved;
    this.country = country;
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

  canMoveTo(next: PlacementQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: PlacementQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.rate * this.endsAt * 100) / 100;
  }

  copy(): PlacementQuota {
    return new PlacementQuota(
      this.code,
      this.name,
      this.checksum,
      this.endsAt,
      this.sendAt,
      this.label,
      this.timezone,
      this.rate,
      this.ownerId,
      this.approved,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a placement quota in status new. */
export function newPlacementQuota(code: string, name: string): PlacementQuota {
  return new PlacementQuota(code, name, "", 0, 0, "", "", 0, "", false, "", "new");
}
