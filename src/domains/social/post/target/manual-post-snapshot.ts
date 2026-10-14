import * as text from "../../../../kit/text.js";

/** Where a manual post snapshot is in its life cycle. */
export type ManualPostSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual post snapshot. Its code is unique within a tenant. */
export class ManualPostSnapshot {
  code: string;
  name: string;
  tags: string[];
  approved: boolean;
  timezone: string;
  priority: number;
  attempts: number;
  createdAt: number;
  archived: boolean;
  status: ManualPostSnapshotStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    approved: boolean,
    timezone: string,
    priority: number,
    attempts: number,
    createdAt: number,
    archived: boolean,
    status: ManualPostSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.approved = approved;
    this.timezone = timezone;
    this.priority = priority;
    this.attempts = attempts;
    this.createdAt = createdAt;
    this.archived = archived;
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

  canMoveTo(next: ManualPostSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualPostSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual post snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.createdAt * this.priority * 100) / 100;
  }

  copy(): ManualPostSnapshot {
    return new ManualPostSnapshot(
      this.code,
      this.name,
      this.tags,
      this.approved,
      this.timezone,
      this.priority,
      this.attempts,
      this.createdAt,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual post snapshot in status draft. */
export function newManualPostSnapshot(code: string, name: string): ManualPostSnapshot {
  return new ManualPostSnapshot(code, name, [], false, "", 0, 0, 0, false, "draft");
}
