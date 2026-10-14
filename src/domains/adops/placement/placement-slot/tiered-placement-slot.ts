/**
 * The tiered placement slot records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered placement slot is in its life cycle. */
export type TieredPlacementSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered placement slot, with what the planners need to act on it. */
export class TieredPlacementSlot {
  code: string;
  name: string;
  expiresAt: number;
  utmSource: string;
  revision: number;
  channel: string;
  status: TieredPlacementSlotStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    utmSource: string,
    revision: number,
    channel: string,
    status: TieredPlacementSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.revision = revision;
    this.channel = channel;
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

  canMoveTo(next: TieredPlacementSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"tiered placement slot"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.expiresAt - this.revision) * 100) / 100;
  }

  copy(): TieredPlacementSlot {
    return new TieredPlacementSlot(
      this.code,
      this.name,
      this.expiresAt,
      this.utmSource,
      this.revision,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered placement slot in status new. */
export function newTieredPlacementSlot(code: string, name: string): TieredPlacementSlot {
  return new TieredPlacementSlot(code, name, 0, "", 0, "", "new");
}
