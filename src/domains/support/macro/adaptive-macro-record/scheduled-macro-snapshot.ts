import * as text from "../../../../kit/text.js";

/** Where a scheduled macro snapshot is in its life cycle. */
export type ScheduledMacroSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled macro snapshot. Its code is unique within a tenant. */
export class ScheduledMacroSnapshot {
  code: string;
  label: string;
  channel: string;
  contactEmail: string;
  ratio: number;
  status: ScheduledMacroSnapshotStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    contactEmail: string,
    ratio: number,
    status: ScheduledMacroSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
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

  canMoveTo(next: ScheduledMacroSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ScheduledMacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled macro snapshot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): ScheduledMacroSnapshot {
    return new ScheduledMacroSnapshot(this.code, this.label, this.channel, this.contactEmail, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled macro snapshot in status idle. */
export function newScheduledMacroSnapshot(code: string, label: string): ScheduledMacroSnapshot {
  return new ScheduledMacroSnapshot(code, label, "", "", 0, "idle");
}
