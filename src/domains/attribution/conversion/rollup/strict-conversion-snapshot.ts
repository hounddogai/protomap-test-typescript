import * as text from "../../../../kit/text.js";

/** Where a strict conversion snapshot is in its life cycle. */
export type StrictConversionSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict conversion snapshot, with what the planners need to act on it. */
export class StrictConversionSnapshot {
  code: string;
  label: string;
  graceDays: number;
  archived: boolean;
  discount: number;
  channel: string;
  budget: number;
  status: StrictConversionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    archived: boolean,
    discount: number,
    channel: string,
    budget: number,
    status: StrictConversionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.archived = archived;
    this.discount = discount;
    this.channel = channel;
    this.budget = budget;
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

  canMoveTo(next: StrictConversionSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictConversionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict conversion snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.discount - this.budget) * 100) / 100;
  }

  copy(): StrictConversionSnapshot {
    return new StrictConversionSnapshot(
      this.code,
      this.label,
      this.graceDays,
      this.archived,
      this.discount,
      this.channel,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict conversion snapshot in status draft. */
export function newStrictConversionSnapshot(code: string, label: string): StrictConversionSnapshot {
  return new StrictConversionSnapshot(code, label, 0, false, 0, "", 0, "draft");
}
