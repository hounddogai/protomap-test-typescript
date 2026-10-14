import * as text from "../../../../kit/text.js";

/** Where a manual enrollment snapshot is in its life cycle. */
export type ManualEnrollmentSnapshotStatus = "created" | "validated" | "published" | "retired";

/** A manual enrollment snapshot. Its code is unique within a tenant. */
export class ManualEnrollmentSnapshot {
  code: string;
  label: string;
  visible: boolean;
  pinned: boolean;
  audienceId: string;
  sendAt: number;
  tags: string[];
  campaignRef: string;
  status: ManualEnrollmentSnapshotStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    pinned: boolean,
    audienceId: string,
    sendAt: number,
    tags: string[],
    campaignRef: string,
    status: ManualEnrollmentSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.tags = tags;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualEnrollmentSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualEnrollmentSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual enrollment snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): ManualEnrollmentSnapshot {
    return new ManualEnrollmentSnapshot(
      this.code,
      this.label,
      this.visible,
      this.pinned,
      this.audienceId,
      this.sendAt,
      this.tags,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual enrollment snapshot in status created. */
export function newManualEnrollmentSnapshot(code: string, label: string): ManualEnrollmentSnapshot {
  return new ManualEnrollmentSnapshot(code, label, false, false, "", 0, [], "", "created");
}
