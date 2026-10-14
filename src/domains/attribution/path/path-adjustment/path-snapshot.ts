import * as text from "../../../../kit/text.js";

/** Where a path snapshot is in its life cycle. */
export type PathSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a path snapshot and its current status. */
export class PathSnapshot {
  code: string;
  label: string;
  variant: string;
  title: string;
  durationMinutes: number;
  contactEmail: string;
  version: number;
  updatedAt: number;
  score: number;
  pinned: boolean;
  tags: string[];
  status: PathSnapshotStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    title: string,
    durationMinutes: number,
    contactEmail: string,
    version: number,
    updatedAt: number,
    score: number,
    pinned: boolean,
    tags: string[],
    status: PathSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.version = version;
    this.updatedAt = updatedAt;
    this.score = score;
    this.pinned = pinned;
    this.tags = tags;
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

  canMoveTo(next: PathSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PathSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"path snapshot"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round(this.durationMinutes * this.score * 100) / 100;
  }

  copy(): PathSnapshot {
    return new PathSnapshot(
      this.code,
      this.label,
      this.variant,
      this.title,
      this.durationMinutes,
      this.contactEmail,
      this.version,
      this.updatedAt,
      this.score,
      this.pinned,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a path snapshot in status proposed. */
export function newPathSnapshot(code: string, label: string): PathSnapshot {
  return new PathSnapshot(code, label, "", "", 0, "", 0, 0, 0, false, [], "proposed");
}
