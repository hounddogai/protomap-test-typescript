import * as text from "../../../../kit/text.js";

/** Where a window snapshot is in its life cycle. */
export type WindowSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One window snapshot, with what the planners need to act on it. */
export class WindowSnapshot {
  code: string;
  name: string;
  contactEmail: string;
  conversionRate: number;
  cost: number;
  notes: string;
  limit: number;
  checksum: string;
  pinned: boolean;
  revision: number;
  archived: boolean;
  status: WindowSnapshotStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    conversionRate: number,
    cost: number,
    notes: string,
    limit: number,
    checksum: string,
    pinned: boolean,
    revision: number,
    archived: boolean,
    status: WindowSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.notes = notes;
    this.limit = limit;
    this.checksum = checksum;
    this.pinned = pinned;
    this.revision = revision;
    this.archived = archived;
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

  canMoveTo(next: WindowSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round(this.cost * this.limit * 100) / 100;
  }

  copy(): WindowSnapshot {
    return new WindowSnapshot(
      this.code,
      this.name,
      this.contactEmail,
      this.conversionRate,
      this.cost,
      this.notes,
      this.limit,
      this.checksum,
      this.pinned,
      this.revision,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window snapshot in status proposed. */
export function newWindowSnapshot(code: string, name: string): WindowSnapshot {
  return new WindowSnapshot(code, name, "", 0, 0, "", 0, "", false, 0, false, "proposed");
}
