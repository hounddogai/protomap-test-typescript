import * as text from "../../../../kit/text.js";

/** Where a csat cycle is in its life cycle. */
export type CsatCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A csat cycle as the csat team keeps it. */
export class CsatCycle {
  code: string;
  name: string;
  pinned: boolean;
  tags: string[];
  revision: number;
  currency: string;
  label: string;
  variant: string;
  archived: boolean;
  batchSize: number;
  notes: string;
  status: CsatCycleStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    tags: string[],
    revision: number,
    currency: string,
    label: string,
    variant: string,
    archived: boolean,
    batchSize: number,
    notes: string,
    status: CsatCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.tags = tags;
    this.revision = revision;
    this.currency = currency;
    this.label = label;
    this.variant = variant;
    this.archived = archived;
    this.batchSize = batchSize;
    this.notes = notes;
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

  canMoveTo(next: CsatCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"csat cycle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize + this.revision) * 100) / 100;
  }

  copy(): CsatCycle {
    return new CsatCycle(
      this.code,
      this.name,
      this.pinned,
      this.tags,
      this.revision,
      this.currency,
      this.label,
      this.variant,
      this.archived,
      this.batchSize,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat cycle in status proposed. */
export function newCsatCycle(code: string, name: string): CsatCycle {
  return new CsatCycle(code, name, false, [], 0, "", "", "", false, 0, "", "proposed");
}
