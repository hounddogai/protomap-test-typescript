/**
 * The scheduled conversion rollup records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled conversion rollup is in its life cycle. */
export type ScheduledConversionRollupStatus = "created" | "validated" | "published" | "retired";

/** A scheduled conversion rollup. Its code is unique within a tenant. */
export class ScheduledConversionRollup {
  code: string;
  name: string;
  batchSize: number;
  notes: string;
  revision: number;
  variant: string;
  utmSource: string;
  category: string;
  status: ScheduledConversionRollupStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    notes: string,
    revision: number,
    variant: string,
    utmSource: string,
    category: string,
    status: ScheduledConversionRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.notes = notes;
    this.revision = revision;
    this.variant = variant;
    this.utmSource = utmSource;
    this.category = category;
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

  canMoveTo(next: ScheduledConversionRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledConversionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled conversion rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.batchSize + this.revision) * 100) / 100;
  }

  copy(): ScheduledConversionRollup {
    return new ScheduledConversionRollup(
      this.code,
      this.name,
      this.batchSize,
      this.notes,
      this.revision,
      this.variant,
      this.utmSource,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled conversion rollup in status created. */
export function newScheduledConversionRollup(code: string, name: string): ScheduledConversionRollup {
  return new ScheduledConversionRollup(code, name, 0, "", 0, "", "", "", "created");
}
