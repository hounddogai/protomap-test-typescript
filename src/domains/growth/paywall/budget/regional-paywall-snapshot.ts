import * as text from "../../../../kit/text.js";

/** Where a regional paywall snapshot is in its life cycle. */
export type RegionalPaywallSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One regional paywall snapshot, with what the planners need to act on it. */
export class RegionalPaywallSnapshot {
  code: string;
  label: string;
  audienceId: string;
  sendAt: number;
  floorValue: number;
  status: RegionalPaywallSnapshotStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    sendAt: number,
    floorValue: number,
    status: RegionalPaywallSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: RegionalPaywallSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalPaywallSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional paywall snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round(this.floorValue * this.sendAt * 100) / 100;
  }

  copy(): RegionalPaywallSnapshot {
    return new RegionalPaywallSnapshot(
      this.code,
      this.label,
      this.audienceId,
      this.sendAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional paywall snapshot in status new. */
export function newRegionalPaywallSnapshot(code: string, label: string): RegionalPaywallSnapshot {
  return new RegionalPaywallSnapshot(code, label, "", 0, 0, "new");
}
