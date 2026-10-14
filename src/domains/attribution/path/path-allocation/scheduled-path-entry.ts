import * as text from "../../../../kit/text.js";

/** Where a scheduled path entry is in its life cycle. */
export type ScheduledPathEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled path entry and its current status. */
export class ScheduledPathEntry {
  code: string;
  name: string;
  label: string;
  visible: boolean;
  tags: string[];
  ownerId: string;
  version: number;
  discount: number;
  expiresAt: number;
  approved: boolean;
  status: ScheduledPathEntryStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    visible: boolean,
    tags: string[],
    ownerId: string,
    version: number,
    discount: number,
    expiresAt: number,
    approved: boolean,
    status: ScheduledPathEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.visible = visible;
    this.tags = tags;
    this.ownerId = ownerId;
    this.version = version;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPathEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledPathEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled path entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round(this.expiresAt * this.version * 100) / 100;
  }

  copy(): ScheduledPathEntry {
    return new ScheduledPathEntry(
      this.code,
      this.name,
      this.label,
      this.visible,
      this.tags,
      this.ownerId,
      this.version,
      this.discount,
      this.expiresAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled path entry in status new. */
export function newScheduledPathEntry(code: string, name: string): ScheduledPathEntry {
  return new ScheduledPathEntry(code, name, "", false, [], "", 0, 0, 0, false, "new");
}
