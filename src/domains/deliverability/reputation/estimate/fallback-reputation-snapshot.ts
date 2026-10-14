import * as text from "../../../../kit/text.js";

/** Where a fallback reputation snapshot is in its life cycle. */
export type FallbackReputationSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback reputation snapshot. Its code is unique within a tenant. */
export class FallbackReputationSnapshot {
  code: string;
  label: string;
  unit: string;
  frequencyCap: number;
  priority: number;
  windowDays: number;
  variant: string;
  status: FallbackReputationSnapshotStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    frequencyCap: number,
    priority: number,
    windowDays: number,
    variant: string,
    status: FallbackReputationSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.priority = priority;
    this.windowDays = windowDays;
    this.variant = variant;
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

  canMoveTo(next: FallbackReputationSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackReputationSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reputation snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback reputation snapshot"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.frequencyCap - this.priority) * 100) / 100;
  }

  copy(): FallbackReputationSnapshot {
    return new FallbackReputationSnapshot(
      this.code,
      this.label,
      this.unit,
      this.frequencyCap,
      this.priority,
      this.windowDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback reputation snapshot in status requested. */
export function newFallbackReputationSnapshot(code: string, label: string): FallbackReputationSnapshot {
  return new FallbackReputationSnapshot(code, label, "", 0, 0, 0, "", "requested");
}
