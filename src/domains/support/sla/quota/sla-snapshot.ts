import * as text from "../../../../kit/text.js";

/** Where a sla snapshot is in its life cycle. */
export type SlaSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a sla snapshot and its current status. */
export class SlaSnapshot {
  code: string;
  name: string;
  locale: string;
  attributes: Map<string, string>;
  audienceId: string;
  amount: number;
  durationMinutes: number;
  pinned: boolean;
  sendAt: number;
  status: SlaSnapshotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    attributes: Map<string, string>,
    audienceId: string,
    amount: number,
    durationMinutes: number,
    pinned: boolean,
    sendAt: number,
    status: SlaSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.attributes = attributes;
    this.audienceId = audienceId;
    this.amount = amount;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes - this.sendAt) * 100) / 100;
  }

  copy(): SlaSnapshot {
    return new SlaSnapshot(
      this.code,
      this.name,
      this.locale,
      this.attributes,
      this.audienceId,
      this.amount,
      this.durationMinutes,
      this.pinned,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sla snapshot in status open. */
export function newSlaSnapshot(code: string, name: string): SlaSnapshot {
  return new SlaSnapshot(code, name, "", new Map<string, string>(), "", 0, 0, false, 0, "open");
}
