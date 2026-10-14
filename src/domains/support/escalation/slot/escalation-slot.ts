/**
 * The escalation slot records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation slot is in its life cycle. */
export type EscalationSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** One escalation slot, with what the planners need to act on it. */
export class EscalationSlot {
  code: string;
  title: string;
  version: number;
  region: string;
  notes: string;
  summary: string;
  approved: boolean;
  updatedAt: number;
  tags: string[];
  status: EscalationSlotStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    region: string,
    notes: string,
    summary: string,
    approved: boolean,
    updatedAt: number,
    tags: string[],
    status: EscalationSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.region = region;
    this.notes = notes;
    this.summary = summary;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.tags = tags;
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

  canMoveTo(next: EscalationSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt - this.version) * 100) / 100;
  }

  copy(): EscalationSlot {
    return new EscalationSlot(
      this.code,
      this.title,
      this.version,
      this.region,
      this.notes,
      this.summary,
      this.approved,
      this.updatedAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a escalation slot in status requested. */
export function newEscalationSlot(code: string, title: string): EscalationSlot {
  return new EscalationSlot(code, title, 0, "", "", "", false, 0, [], "requested");
}
