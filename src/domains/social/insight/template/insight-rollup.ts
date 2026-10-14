import * as text from "../../../../kit/text.js";

/** Where a insight rollup is in its life cycle. */
export type InsightRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A insight rollup. Its code is unique within a tenant. */
export class InsightRollup {
  code: string;
  name: string;
  limit: number;
  checksum: string;
  notes: string;
  capacity: number;
  locale: string;
  pinned: boolean;
  status: InsightRollupStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    checksum: string,
    notes: string,
    capacity: number,
    locale: string,
    pinned: boolean,
    status: InsightRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.checksum = checksum;
    this.notes = notes;
    this.capacity = capacity;
    this.locale = locale;
    this.pinned = pinned;
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

  canMoveTo(next: InsightRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: InsightRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netExposure(): number {
    return Math.round(this.capacity * this.limit * 100) / 100;
  }

  copy(): InsightRollup {
    return new InsightRollup(
      this.code,
      this.name,
      this.limit,
      this.checksum,
      this.notes,
      this.capacity,
      this.locale,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a insight rollup in status draft. */
export function newInsightRollup(code: string, name: string): InsightRollup {
  return new InsightRollup(code, name, 0, "", "", 0, "", false, "draft");
}
