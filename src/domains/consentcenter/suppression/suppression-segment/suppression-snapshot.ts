import * as text from "../../../../kit/text.js";

/** Where a suppression snapshot is in its life cycle. */
export type SuppressionSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A suppression snapshot. Its code is unique within a tenant. */
export class SuppressionSnapshot {
  code: string;
  label: string;
  weight: number;
  priority: number;
  pinned: boolean;
  ownerId: string;
  status: SuppressionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    priority: number,
    pinned: boolean,
    ownerId: string,
    status: SuppressionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.priority = priority;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round(this.priority * this.weight * 100) / 100;
  }

  copy(): SuppressionSnapshot {
    return new SuppressionSnapshot(
      this.code,
      this.label,
      this.weight,
      this.priority,
      this.pinned,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression snapshot in status requested. */
export function newSuppressionSnapshot(code: string, label: string): SuppressionSnapshot {
  return new SuppressionSnapshot(code, label, 0, 0, false, "", "requested");
}
