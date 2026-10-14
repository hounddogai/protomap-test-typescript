/**
 * The tiered pacing target records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered pacing target is in its life cycle. */
export type TieredPacingTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** One tiered pacing target, with what the planners need to act on it. */
export class TieredPacingTarget {
  code: string;
  title: string;
  active: boolean;
  sendAt: number;
  archived: boolean;
  channel: string;
  status: TieredPacingTargetStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    sendAt: number,
    archived: boolean,
    channel: string,
    status: TieredPacingTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.sendAt = sendAt;
    this.archived = archived;
    this.channel = channel;
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

  canMoveTo(next: TieredPacingTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: TieredPacingTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): TieredPacingTarget {
    return new TieredPacingTarget(
      this.code,
      this.title,
      this.active,
      this.sendAt,
      this.archived,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered pacing target in status requested. */
export function newTieredPacingTarget(code: string, title: string): TieredPacingTarget {
  return new TieredPacingTarget(code, title, false, 0, false, "", "requested");
}
