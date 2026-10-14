import * as text from "../../../../kit/text.js";

/** Where a double opt in snapshot is in its life cycle. */
export type DoubleOptInSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A double opt in snapshot as the double opt in team keeps it. */
export class DoubleOptInSnapshot {
  code: string;
  title: string;
  channel: string;
  ceiling: number;
  reviewer: string;
  name: string;
  label: string;
  notes: string;
  threshold: number;
  cost: number;
  checksum: string;
  status: DoubleOptInSnapshotStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    ceiling: number,
    reviewer: string,
    name: string,
    label: string,
    notes: string,
    threshold: number,
    cost: number,
    checksum: string,
    status: DoubleOptInSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.name = name;
    this.label = label;
    this.notes = notes;
    this.threshold = threshold;
    this.cost = cost;
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

  canMoveTo(next: DoubleOptInSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"double opt in snapshot"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.threshold + this.cost) * 100) / 100;
  }

  copy(): DoubleOptInSnapshot {
    return new DoubleOptInSnapshot(
      this.code,
      this.title,
      this.channel,
      this.ceiling,
      this.reviewer,
      this.name,
      this.label,
      this.notes,
      this.threshold,
      this.cost,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a double opt in snapshot in status idle. */
export function newDoubleOptInSnapshot(code: string, title: string): DoubleOptInSnapshot {
  return new DoubleOptInSnapshot(code, title, "", 0, "", "", "", "", 0, 0, "", "idle");
}
