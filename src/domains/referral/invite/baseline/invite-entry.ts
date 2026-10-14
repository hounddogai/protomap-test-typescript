import * as text from "../../../../kit/text.js";

/** Where a invite entry is in its life cycle. */
export type InviteEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A invite entry. Its code is unique within a tenant. */
export class InviteEntry {
  code: string;
  title: string;
  segment: string;
  reviewer: string;
  expiresAt: number;
  utmSource: string;
  archived: boolean;
  status: InviteEntryStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    reviewer: string,
    expiresAt: number,
    utmSource: string,
    archived: boolean,
    status: InviteEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): InviteEntry {
    return new InviteEntry(
      this.code,
      this.title,
      this.segment,
      this.reviewer,
      this.expiresAt,
      this.utmSource,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite entry in status planned. */
export function newInviteEntry(code: string, title: string): InviteEntry {
  return new InviteEntry(code, title, "", "", 0, "", false, "planned");
}
