/**
 * The sla rollup records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla rollup is in its life cycle. */
export type SlaRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sla rollup as the sla team keeps it. */
export class SlaRollup {
  code: string;
  label: string;
  phone: string;
  batchSize: number;
  utmSource: string;
  status: SlaRollupStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    batchSize: number,
    utmSource: string,
    status: SlaRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.batchSize = batchSize;
    this.utmSource = utmSource;
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

  canMoveTo(next: SlaRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SlaRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"sla rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): SlaRollup {
    return new SlaRollup(this.code, this.label, this.phone, this.batchSize, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a sla rollup in status new. */
export function newSlaRollup(code: string, label: string): SlaRollup {
  return new SlaRollup(code, label, "", 0, "", "new");
}
