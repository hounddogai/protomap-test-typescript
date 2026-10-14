import * as text from "../../../../kit/text.js";

/** Where a badge snapshot is in its life cycle. */
export type BadgeSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A badge snapshot. Its code is unique within a tenant. */
export class BadgeSnapshot {
  code: string;
  label: string;
  durationMinutes: number;
  active: boolean;
  contactEmail: string;
  summary: string;
  notes: string;
  archived: boolean;
  externalRef: string;
  region: string;
  checksum: string;
  status: BadgeSnapshotStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    active: boolean,
    contactEmail: string,
    summary: string,
    notes: string,
    archived: boolean,
    externalRef: string,
    region: string,
    checksum: string,
    status: BadgeSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.active = active;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.notes = notes;
    this.archived = archived;
    this.externalRef = externalRef;
    this.region = region;
    this.checksum = checksum;
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

  canMoveTo(next: BadgeSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BadgeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): BadgeSnapshot {
    return new BadgeSnapshot(
      this.code,
      this.label,
      this.durationMinutes,
      this.active,
      this.contactEmail,
      this.summary,
      this.notes,
      this.archived,
      this.externalRef,
      this.region,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a badge snapshot in status open. */
export function newBadgeSnapshot(code: string, label: string): BadgeSnapshot {
  return new BadgeSnapshot(code, label, 0, false, "", "", "", false, "", "", "", "open");
}
