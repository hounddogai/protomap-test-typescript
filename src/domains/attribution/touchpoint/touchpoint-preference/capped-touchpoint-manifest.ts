import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint manifest is in its life cycle. */
export type CappedTouchpointManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped touchpoint manifest and its current status. */
export class CappedTouchpointManifest {
  code: string;
  title: string;
  updatedAt: number;
  notes: string;
  channel: string;
  weight: number;
  priority: number;
  checksum: string;
  status: CappedTouchpointManifestStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    notes: string,
    channel: string,
    weight: number,
    priority: number,
    checksum: string,
    status: CappedTouchpointManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.notes = notes;
    this.channel = channel;
    this.weight = weight;
    this.priority = priority;
    this.checksum = checksum;
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

  canMoveTo(next: CappedTouchpointManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedTouchpointManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.priority + this.weight) * 100) / 100;
  }

  copy(): CappedTouchpointManifest {
    return new CappedTouchpointManifest(
      this.code,
      this.title,
      this.updatedAt,
      this.notes,
      this.channel,
      this.weight,
      this.priority,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped touchpoint manifest in status planned. */
export function newCappedTouchpointManifest(code: string, title: string): CappedTouchpointManifest {
  return new CappedTouchpointManifest(code, title, 0, "", "", 0, 0, "", "planned");
}
