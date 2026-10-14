/**
 * The manual frequency request records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual frequency request is in its life cycle. */
export type ManualFrequencyRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual frequency request as the frequency team keeps it. */
export class ManualFrequencyRequest {
  code: string;
  name: string;
  endsAt: number;
  active: boolean;
  unit: string;
  revision: number;
  amount: number;
  startsAt: number;
  archived: boolean;
  checksum: string;
  status: ManualFrequencyRequestStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    active: boolean,
    unit: string,
    revision: number,
    amount: number,
    startsAt: number,
    archived: boolean,
    checksum: string,
    status: ManualFrequencyRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.active = active;
    this.unit = unit;
    this.revision = revision;
    this.amount = amount;
    this.startsAt = startsAt;
    this.archived = archived;
    this.checksum = checksum;
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

  canMoveTo(next: ManualFrequencyRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: ManualFrequencyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual frequency request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.endsAt + this.revision) * 100) / 100;
  }

  copy(): ManualFrequencyRequest {
    return new ManualFrequencyRequest(
      this.code,
      this.name,
      this.endsAt,
      this.active,
      this.unit,
      this.revision,
      this.amount,
      this.startsAt,
      this.archived,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual frequency request in status new. */
export function newManualFrequencyRequest(code: string, name: string): ManualFrequencyRequest {
  return new ManualFrequencyRequest(code, name, 0, false, "", 0, 0, 0, false, "", "new");
}
