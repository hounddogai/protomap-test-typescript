/**
 * The csat entry records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat entry is in its life cycle. */
export type CsatEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A csat entry as the csat team keeps it. */
export class CsatEntry {
  code: string;
  label: string;
  approved: boolean;
  windowDays: number;
  version: number;
  quantity: number;
  impressions: number;
  endsAt: number;
  status: CsatEntryStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    windowDays: number,
    version: number,
    quantity: number,
    impressions: number,
    endsAt: number,
    status: CsatEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.windowDays = windowDays;
    this.version = version;
    this.quantity = quantity;
    this.impressions = impressions;
    this.endsAt = endsAt;
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

  canMoveTo(next: CsatEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
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

  moveTo(next: CsatEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"csat entry"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.version * this.impressions * 100) / 100;
  }

  copy(): CsatEntry {
    return new CsatEntry(
      this.code,
      this.label,
      this.approved,
      this.windowDays,
      this.version,
      this.quantity,
      this.impressions,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat entry in status requested. */
export function newCsatEntry(code: string, label: string): CsatEntry {
  return new CsatEntry(code, label, false, 0, 0, 0, 0, 0, "requested");
}
