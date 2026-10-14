import * as text from "../../../../kit/text.js";

/** Where a capped path snapshot is in its life cycle. */
export type CappedPathSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped path snapshot. Its code is unique within a tenant. */
export class CappedPathSnapshot {
  code: string;
  title: string;
  budget: number;
  region: string;
  locale: string;
  checksum: string;
  status: CappedPathSnapshotStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    region: string,
    locale: string,
    checksum: string,
    status: CappedPathSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.region = region;
    this.locale = locale;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPathSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedPathSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped path snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): CappedPathSnapshot {
    return new CappedPathSnapshot(
      this.code,
      this.title,
      this.budget,
      this.region,
      this.locale,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped path snapshot in status planned. */
export function newCappedPathSnapshot(code: string, title: string): CappedPathSnapshot {
  return new CappedPathSnapshot(code, title, 0, "", "", "", "planned");
}
