import * as text from "../../../../kit/text.js";

/** Where a rolling credit mapping is in its life cycle. */
export type RollingCreditMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling credit mapping. Its code is unique within a tenant. */
export class RollingCreditMapping {
  code: string;
  title: string;
  quantity: number;
  weight: number;
  graceDays: number;
  pinned: boolean;
  batchSize: number;
  status: RollingCreditMappingStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    weight: number,
    graceDays: number,
    pinned: boolean,
    batchSize: number,
    status: RollingCreditMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.weight = weight;
    this.graceDays = graceDays;
    this.pinned = pinned;
    this.batchSize = batchSize;
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

  canMoveTo(next: RollingCreditMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingCreditMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling credit mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling credit mapping"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.batchSize + this.quantity) * 100) / 100;
  }

  copy(): RollingCreditMapping {
    return new RollingCreditMapping(
      this.code,
      this.title,
      this.quantity,
      this.weight,
      this.graceDays,
      this.pinned,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling credit mapping in status idle. */
export function newRollingCreditMapping(code: string, title: string): RollingCreditMapping {
  return new RollingCreditMapping(code, title, 0, 0, 0, false, 0, "idle");
}
