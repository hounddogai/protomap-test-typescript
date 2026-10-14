/**
 * The lenient deflection snapshot records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient deflection snapshot is in its life cycle. */
export type LenientDeflectionSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient deflection snapshot. Its code is unique within a tenant. */
export class LenientDeflectionSnapshot {
  code: string;
  label: string;
  windowDays: number;
  active: boolean;
  sendAt: number;
  retries: number;
  channel: string;
  journeyId: string;
  status: LenientDeflectionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    active: boolean,
    sendAt: number,
    retries: number,
    channel: string,
    journeyId: string,
    status: LenientDeflectionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.active = active;
    this.sendAt = sendAt;
    this.retries = retries;
    this.channel = channel;
    this.journeyId = journeyId;
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

  canMoveTo(next: LenientDeflectionSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
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

  moveTo(next: LenientDeflectionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.sendAt * this.windowDays * 100) / 100;
  }

  copy(): LenientDeflectionSnapshot {
    return new LenientDeflectionSnapshot(
      this.code,
      this.label,
      this.windowDays,
      this.active,
      this.sendAt,
      this.retries,
      this.channel,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient deflection snapshot in status draft. */
export function newLenientDeflectionSnapshot(code: string, label: string): LenientDeflectionSnapshot {
  return new LenientDeflectionSnapshot(code, label, 0, false, 0, 0, "", "", "draft");
}
