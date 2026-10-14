/**
 * The seasonal branch snapshot records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal branch snapshot is in its life cycle. */
export type SeasonalBranchSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a seasonal branch snapshot and its current status. */
export class SeasonalBranchSnapshot {
  code: string;
  title: string;
  name: string;
  audienceId: string;
  ceiling: number;
  active: boolean;
  frequencyCap: number;
  currency: string;
  ownerId: string;
  status: SeasonalBranchSnapshotStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    audienceId: string,
    ceiling: number,
    active: boolean,
    frequencyCap: number,
    currency: string,
    ownerId: string,
    status: SeasonalBranchSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.currency = currency;
    this.ownerId = ownerId;
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

  canMoveTo(next: SeasonalBranchSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalBranchSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal branch snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal branch snapshot"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.frequencyCap + this.ceiling) * 100) / 100;
  }

  copy(): SeasonalBranchSnapshot {
    return new SeasonalBranchSnapshot(
      this.code,
      this.title,
      this.name,
      this.audienceId,
      this.ceiling,
      this.active,
      this.frequencyCap,
      this.currency,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal branch snapshot in status requested. */
export function newSeasonalBranchSnapshot(code: string, title: string): SeasonalBranchSnapshot {
  return new SeasonalBranchSnapshot(code, title, "", "", 0, false, 0, "", "", "requested");
}
