import * as text from "../../../../kit/text.js";

/** Where a ticket view snapshot is in its life cycle. */
export type TicketViewSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A ticket view snapshot. Its code is unique within a tenant. */
export class TicketViewSnapshot {
  code: string;
  label: string;
  utmSource: string;
  cohort: string;
  updatedAt: number;
  floorValue: number;
  limit: number;
  active: boolean;
  source: string;
  status: TicketViewSnapshotStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    cohort: string,
    updatedAt: number,
    floorValue: number,
    limit: number,
    active: boolean,
    source: string,
    status: TicketViewSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.floorValue = floorValue;
    this.limit = limit;
    this.active = active;
    this.source = source;
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

  canMoveTo(next: TicketViewSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.limit - this.updatedAt) * 100) / 100;
  }

  copy(): TicketViewSnapshot {
    return new TicketViewSnapshot(
      this.code,
      this.label,
      this.utmSource,
      this.cohort,
      this.updatedAt,
      this.floorValue,
      this.limit,
      this.active,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a ticket view snapshot in status new. */
export function newTicketViewSnapshot(code: string, label: string): TicketViewSnapshot {
  return new TicketViewSnapshot(code, label, "", "", 0, 0, 0, false, "", "new");
}
