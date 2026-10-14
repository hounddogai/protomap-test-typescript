import * as text from "../../../../kit/text.js";

/** Where a rolling approval window is in its life cycle. */
export type RollingApprovalWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling approval window and its current status. */
export class RollingApprovalWindow {
  code: string;
  name: string;
  updatedAt: number;
  priority: number;
  capacity: number;
  channel: string;
  impressions: number;
  status: RollingApprovalWindowStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    priority: number,
    capacity: number,
    channel: string,
    impressions: number,
    status: RollingApprovalWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.capacity = capacity;
    this.channel = channel;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingApprovalWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingApprovalWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling approval window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.capacity + this.impressions) * 100) / 100;
  }

  copy(): RollingApprovalWindow {
    return new RollingApprovalWindow(
      this.code,
      this.name,
      this.updatedAt,
      this.priority,
      this.capacity,
      this.channel,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling approval window in status requested. */
export function newRollingApprovalWindow(code: string, name: string): RollingApprovalWindow {
  return new RollingApprovalWindow(code, name, 0, 0, 0, "", 0, "requested");
}
