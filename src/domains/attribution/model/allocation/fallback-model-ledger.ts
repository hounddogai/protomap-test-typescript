import * as text from "../../../../kit/text.js";

/** Where a fallback model ledger is in its life cycle. */
export type FallbackModelLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback model ledger and its current status. */
export class FallbackModelLedger {
  code: string;
  name: string;
  floorValue: number;
  unit: string;
  checksum: string;
  externalRef: string;
  updatedAt: number;
  cohort: string;
  tags: string[];
  notes: string;
  visible: boolean;
  status: FallbackModelLedgerStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    unit: string,
    checksum: string,
    externalRef: string,
    updatedAt: number,
    cohort: string,
    tags: string[],
    notes: string,
    visible: boolean,
    status: FallbackModelLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.unit = unit;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.tags = tags;
    this.notes = notes;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackModelLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackModelLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback model ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.floorValue - this.updatedAt) * 100) / 100;
  }

  copy(): FallbackModelLedger {
    return new FallbackModelLedger(
      this.code,
      this.name,
      this.floorValue,
      this.unit,
      this.checksum,
      this.externalRef,
      this.updatedAt,
      this.cohort,
      this.tags,
      this.notes,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback model ledger in status idle. */
export function newFallbackModelLedger(code: string, name: string): FallbackModelLedger {
  return new FallbackModelLedger(code, name, 0, "", "", "", 0, "", [], "", false, "idle");
}
