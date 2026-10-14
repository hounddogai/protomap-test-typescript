import * as text from "../../../../kit/text.js";

/** Where a global sender entry is in its life cycle. */
export type GlobalSenderEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global sender entry as the sender team keeps it. */
export class GlobalSenderEntry {
  code: string;
  label: string;
  startsAt: number;
  budget: number;
  sendAt: number;
  attributes: Map<string, string>;
  expiresAt: number;
  graceDays: number;
  channel: string;
  status: GlobalSenderEntryStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    budget: number,
    sendAt: number,
    attributes: Map<string, string>,
    expiresAt: number,
    graceDays: number,
    channel: string,
    status: GlobalSenderEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.budget = budget;
    this.sendAt = sendAt;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.channel = channel;
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

  canMoveTo(next: GlobalSenderEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalSenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global sender entry"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.expiresAt + this.startsAt) * 100) / 100;
  }

  copy(): GlobalSenderEntry {
    return new GlobalSenderEntry(
      this.code,
      this.label,
      this.startsAt,
      this.budget,
      this.sendAt,
      this.attributes,
      this.expiresAt,
      this.graceDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global sender entry in status open. */
export function newGlobalSenderEntry(code: string, label: string): GlobalSenderEntry {
  return new GlobalSenderEntry(code, label, 0, 0, 0, new Map<string, string>(), 0, 0, "", "open");
}
