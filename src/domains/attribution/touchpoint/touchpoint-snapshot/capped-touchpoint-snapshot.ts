/**
 * The capped touchpoint snapshot records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint snapshot is in its life cycle. */
export type CappedTouchpointSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped touchpoint snapshot as the touchpoint team keeps it. */
export class CappedTouchpointSnapshot {
  code: string;
  title: string;
  sendAt: number;
  bid: number;
  visible: boolean;
  score: number;
  durationMinutes: number;
  region: string;
  graceDays: number;
  maximum: number;
  status: CappedTouchpointSnapshotStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    bid: number,
    visible: boolean,
    score: number,
    durationMinutes: number,
    region: string,
    graceDays: number,
    maximum: number,
    status: CappedTouchpointSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.bid = bid;
    this.visible = visible;
    this.score = score;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.graceDays = graceDays;
    this.maximum = maximum;
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

  canMoveTo(next: CappedTouchpointSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTouchpointSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.bid - this.sendAt) * 100) / 100;
  }

  copy(): CappedTouchpointSnapshot {
    return new CappedTouchpointSnapshot(
      this.code,
      this.title,
      this.sendAt,
      this.bid,
      this.visible,
      this.score,
      this.durationMinutes,
      this.region,
      this.graceDays,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped touchpoint snapshot in status new. */
export function newCappedTouchpointSnapshot(code: string, title: string): CappedTouchpointSnapshot {
  return new CappedTouchpointSnapshot(code, title, 0, 0, false, 0, 0, "", 0, 0, "new");
}
