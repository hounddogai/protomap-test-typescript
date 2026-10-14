import * as text from "../../../../kit/text.js";

/** Where a tiered nudge snapshot is in its life cycle. */
export type TieredNudgeSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One tiered nudge snapshot, with what the planners need to act on it. */
export class TieredNudgeSnapshot {
  code: string;
  title: string;
  pinned: boolean;
  quantity: number;
  attributes: Map<string, string>;
  sendAt: number;
  status: TieredNudgeSnapshotStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    quantity: number,
    attributes: Map<string, string>,
    sendAt: number,
    status: TieredNudgeSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.quantity = quantity;
    this.attributes = attributes;
    this.sendAt = sendAt;
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

  canMoveTo(next: TieredNudgeSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
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

  moveTo(next: TieredNudgeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered nudge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered nudge snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.sendAt + this.quantity) * 100) / 100;
  }

  copy(): TieredNudgeSnapshot {
    return new TieredNudgeSnapshot(
      this.code,
      this.title,
      this.pinned,
      this.quantity,
      this.attributes,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered nudge snapshot in status draft. */
export function newTieredNudgeSnapshot(code: string, title: string): TieredNudgeSnapshot {
  return new TieredNudgeSnapshot(code, title, false, 0, new Map<string, string>(), 0, "draft");
}
