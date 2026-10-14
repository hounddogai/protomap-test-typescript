import * as text from "../../../../kit/text.js";

/** Where a regional double opt in entry is in its life cycle. */
export type RegionalDoubleOptInEntryStatus = "created" | "validated" | "published" | "retired";

/** A regional double opt in entry as the double opt in team keeps it. */
export class RegionalDoubleOptInEntry {
  code: string;
  label: string;
  quantity: number;
  limit: number;
  description: string;
  retries: number;
  status: RegionalDoubleOptInEntryStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    limit: number,
    description: string,
    retries: number,
    status: RegionalDoubleOptInEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.limit = limit;
    this.description = description;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalDoubleOptInEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalDoubleOptInEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional double opt in entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional double opt in entry"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.limit + this.quantity) * 100) / 100;
  }

  copy(): RegionalDoubleOptInEntry {
    return new RegionalDoubleOptInEntry(
      this.code,
      this.label,
      this.quantity,
      this.limit,
      this.description,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional double opt in entry in status created. */
export function newRegionalDoubleOptInEntry(code: string, label: string): RegionalDoubleOptInEntry {
  return new RegionalDoubleOptInEntry(code, label, 0, 0, "", 0, "created");
}
