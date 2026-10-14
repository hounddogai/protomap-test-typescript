/**
 * The pacing quota records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing quota is in its life cycle. */
export type PacingQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pacing quota as the pacing team keeps it. */
export class PacingQuota {
  code: string;
  label: string;
  capacity: number;
  ratio: number;
  checksum: string;
  status: PacingQuotaStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    ratio: number,
    checksum: string,
    status: PacingQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.ratio = ratio;
    this.checksum = checksum;
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

  canMoveTo(next: PacingQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.capacity - this.ratio) * 100) / 100;
  }

  copy(): PacingQuota {
    return new PacingQuota(this.code, this.label, this.capacity, this.ratio, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing quota in status idle. */
export function newPacingQuota(code: string, label: string): PacingQuota {
  return new PacingQuota(code, label, 0, 0, "", "idle");
}
