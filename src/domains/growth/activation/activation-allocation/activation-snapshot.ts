import * as text from "../../../../kit/text.js";

/** Where a activation snapshot is in its life cycle. */
export type ActivationSnapshotStatus = "created" | "validated" | "published" | "retired";

/** One activation snapshot, with what the planners need to act on it. */
export class ActivationSnapshot {
  code: string;
  title: string;
  attributes: Map<string, string>;
  summary: string;
  sequence: number;
  notes: string;
  impressions: number;
  sendAt: number;
  version: number;
  externalRef: string;
  status: ActivationSnapshotStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    summary: string,
    sequence: number,
    notes: string,
    impressions: number,
    sendAt: number,
    version: number,
    externalRef: string,
    status: ActivationSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.summary = summary;
    this.sequence = sequence;
    this.notes = notes;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.version = version;
    this.externalRef = externalRef;
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

  canMoveTo(next: ActivationSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ActivationSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"activation snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.sendAt * this.impressions * 100) / 100;
  }

  copy(): ActivationSnapshot {
    return new ActivationSnapshot(
      this.code,
      this.title,
      this.attributes,
      this.summary,
      this.sequence,
      this.notes,
      this.impressions,
      this.sendAt,
      this.version,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a activation snapshot in status created. */
export function newActivationSnapshot(code: string, title: string): ActivationSnapshot {
  return new ActivationSnapshot(code, title, new Map<string, string>(), "", 0, "", 0, 0, 0, "", "created");
}
