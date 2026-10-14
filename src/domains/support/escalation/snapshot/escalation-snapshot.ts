/**
 * The escalation snapshot records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation snapshot is in its life cycle. */
export type EscalationSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A escalation snapshot. Its code is unique within a tenant. */
export class EscalationSnapshot {
  code: string;
  title: string;
  active: boolean;
  category: string;
  score: number;
  conversionRate: number;
  journeyId: string;
  attributes: Map<string, string>;
  openRate: number;
  pinned: boolean;
  status: EscalationSnapshotStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    category: string,
    score: number,
    conversionRate: number,
    journeyId: string,
    attributes: Map<string, string>,
    openRate: number,
    pinned: boolean,
    status: EscalationSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.category = category;
    this.score = score;
    this.conversionRate = conversionRate;
    this.journeyId = journeyId;
    this.attributes = attributes;
    this.openRate = openRate;
    this.pinned = pinned;
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

  canMoveTo(next: EscalationSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: EscalationSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.openRate * this.conversionRate * 100) / 100;
  }

  copy(): EscalationSnapshot {
    return new EscalationSnapshot(
      this.code,
      this.title,
      this.active,
      this.category,
      this.score,
      this.conversionRate,
      this.journeyId,
      this.attributes,
      this.openRate,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a escalation snapshot in status requested. */
export function newEscalationSnapshot(code: string, title: string): EscalationSnapshot {
  return new EscalationSnapshot(code, title, false, "", 0, 0, "", new Map<string, string>(), 0, false, "requested");
}
