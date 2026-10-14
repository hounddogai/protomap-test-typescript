import * as text from "../../../../kit/text.js";

/** Where a pending deflection entry is in its life cycle. */
export type PendingDeflectionEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending deflection entry and its current status. */
export class PendingDeflectionEntry {
  code: string;
  name: string;
  updatedAt: number;
  openRate: number;
  label: string;
  score: number;
  phone: string;
  retries: number;
  channel: string;
  status: PendingDeflectionEntryStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    openRate: number,
    label: string,
    score: number,
    phone: string,
    retries: number,
    channel: string,
    status: PendingDeflectionEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.label = label;
    this.score = score;
    this.phone = phone;
    this.retries = retries;
    this.channel = channel;
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

  canMoveTo(next: PendingDeflectionEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingDeflectionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending deflection entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending deflection entry"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.updatedAt - this.retries) * 100) / 100;
  }

  copy(): PendingDeflectionEntry {
    return new PendingDeflectionEntry(
      this.code,
      this.name,
      this.updatedAt,
      this.openRate,
      this.label,
      this.score,
      this.phone,
      this.retries,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending deflection entry in status draft. */
export function newPendingDeflectionEntry(code: string, name: string): PendingDeflectionEntry {
  return new PendingDeflectionEntry(code, name, 0, 0, "", 0, "", 0, "", "draft");
}
