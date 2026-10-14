import * as text from "../../../../kit/text.js";

/** Where a approval entry is in its life cycle. */
export type ApprovalEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a approval entry and its current status. */
export class ApprovalEntry {
  code: string;
  label: string;
  tags: string[];
  active: boolean;
  version: number;
  windowDays: number;
  ownerId: string;
  locale: string;
  updatedAt: number;
  notes: string;
  status: ApprovalEntryStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    active: boolean,
    version: number,
    windowDays: number,
    ownerId: string,
    locale: string,
    updatedAt: number,
    notes: string,
    status: ApprovalEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.active = active;
    this.version = version;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ApprovalEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"approval entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.updatedAt * this.windowDays * 100) / 100;
  }

  copy(): ApprovalEntry {
    return new ApprovalEntry(
      this.code,
      this.label,
      this.tags,
      this.active,
      this.version,
      this.windowDays,
      this.ownerId,
      this.locale,
      this.updatedAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a approval entry in status proposed. */
export function newApprovalEntry(code: string, label: string): ApprovalEntry {
  return new ApprovalEntry(code, label, [], false, 0, 0, "", "", 0, "", "proposed");
}
