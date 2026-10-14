/**
 * The tiered branch profile records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered branch profile is in its life cycle. */
export type TieredBranchProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered branch profile and its current status. */
export class TieredBranchProfile {
  code: string;
  name: string;
  ratio: number;
  country: string;
  graceDays: number;
  phone: string;
  ownerId: string;
  status: TieredBranchProfileStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    country: string,
    graceDays: number,
    phone: string,
    ownerId: string,
    status: TieredBranchProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.country = country;
    this.graceDays = graceDays;
    this.phone = phone;
    this.ownerId = ownerId;
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

  canMoveTo(next: TieredBranchProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
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

  moveTo(next: TieredBranchProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered branch profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round(this.ratio * this.graceDays * 100) / 100;
  }

  copy(): TieredBranchProfile {
    return new TieredBranchProfile(
      this.code,
      this.name,
      this.ratio,
      this.country,
      this.graceDays,
      this.phone,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered branch profile in status new. */
export function newTieredBranchProfile(code: string, name: string): TieredBranchProfile {
  return new TieredBranchProfile(code, name, 0, "", 0, "", "", "new");
}
