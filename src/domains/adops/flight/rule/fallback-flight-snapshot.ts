import * as text from "../../../../kit/text.js";

/** Where a fallback flight snapshot is in its life cycle. */
export type FallbackFlightSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a fallback flight snapshot and its current status. */
export class FallbackFlightSnapshot {
  code: string;
  label: string;
  category: string;
  expiresAt: number;
  archived: boolean;
  maximum: number;
  status: FallbackFlightSnapshotStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    expiresAt: number,
    archived: boolean,
    maximum: number,
    status: FallbackFlightSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.maximum = maximum;
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

  canMoveTo(next: FallbackFlightSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FallbackFlightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback flight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round(this.expiresAt * this.maximum * 100) / 100;
  }

  copy(): FallbackFlightSnapshot {
    return new FallbackFlightSnapshot(
      this.code,
      this.label,
      this.category,
      this.expiresAt,
      this.archived,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback flight snapshot in status draft. */
export function newFallbackFlightSnapshot(code: string, label: string): FallbackFlightSnapshot {
  return new FallbackFlightSnapshot(code, label, "", 0, false, 0, "draft");
}
