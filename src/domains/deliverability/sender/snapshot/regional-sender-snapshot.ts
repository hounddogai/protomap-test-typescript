/**
 * The regional sender snapshot records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional sender snapshot is in its life cycle. */
export type RegionalSenderSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional sender snapshot and its current status. */
export class RegionalSenderSnapshot {
  code: string;
  label: string;
  approved: boolean;
  region: string;
  reviewer: string;
  version: number;
  checksum: string;
  status: RegionalSenderSnapshotStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    region: string,
    reviewer: string,
    version: number,
    checksum: string,
    status: RegionalSenderSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.region = region;
    this.reviewer = reviewer;
    this.version = version;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSenderSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalSenderSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sender snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"regional sender snapshot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): RegionalSenderSnapshot {
    return new RegionalSenderSnapshot(
      this.code,
      this.label,
      this.approved,
      this.region,
      this.reviewer,
      this.version,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional sender snapshot in status proposed. */
export function newRegionalSenderSnapshot(code: string, label: string): RegionalSenderSnapshot {
  return new RegionalSenderSnapshot(code, label, false, "", "", 0, "", "proposed");
}
