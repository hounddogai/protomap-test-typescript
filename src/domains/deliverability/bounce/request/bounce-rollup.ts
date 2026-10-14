import * as text from "../../../../kit/text.js";

/** Where a bounce rollup is in its life cycle. */
export type BounceRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A bounce rollup as the bounce team keeps it. */
export class BounceRollup {
  code: string;
  title: string;
  attempts: number;
  durationMinutes: number;
  revision: number;
  floorValue: number;
  archived: boolean;
  ownerId: string;
  windowDays: number;
  discount: number;
  sendAt: number;
  status: BounceRollupStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    durationMinutes: number,
    revision: number,
    floorValue: number,
    archived: boolean,
    ownerId: string,
    windowDays: number,
    discount: number,
    sendAt: number,
    status: BounceRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
    this.floorValue = floorValue;
    this.archived = archived;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.discount = discount;
    this.sendAt = sendAt;
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

  canMoveTo(next: BounceRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BounceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.durationMinutes + this.sendAt) * 100) / 100;
  }

  copy(): BounceRollup {
    return new BounceRollup(
      this.code,
      this.title,
      this.attempts,
      this.durationMinutes,
      this.revision,
      this.floorValue,
      this.archived,
      this.ownerId,
      this.windowDays,
      this.discount,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bounce rollup in status new. */
export function newBounceRollup(code: string, title: string): BounceRollup {
  return new BounceRollup(code, title, 0, 0, 0, 0, false, "", 0, 0, 0, "new");
}
