import * as text from "../../../../kit/text.js";

/** Where a capped model snapshot is in its life cycle. */
export type CappedModelSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped model snapshot. Its code is unique within a tenant. */
export class CappedModelSnapshot {
  code: string;
  name: string;
  quantity: number;
  visible: boolean;
  unit: string;
  budget: number;
  updatedAt: number;
  country: string;
  ceiling: number;
  threshold: number;
  status: CappedModelSnapshotStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    visible: boolean,
    unit: string,
    budget: number,
    updatedAt: number,
    country: string,
    ceiling: number,
    threshold: number,
    status: CappedModelSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.visible = visible;
    this.unit = unit;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.country = country;
    this.ceiling = ceiling;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedModelSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedModelSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped model snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"capped model snapshot"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.updatedAt * this.ceiling * 100) / 100;
  }

  copy(): CappedModelSnapshot {
    return new CappedModelSnapshot(
      this.code,
      this.name,
      this.quantity,
      this.visible,
      this.unit,
      this.budget,
      this.updatedAt,
      this.country,
      this.ceiling,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped model snapshot in status idle. */
export function newCappedModelSnapshot(code: string, name: string): CappedModelSnapshot {
  return new CappedModelSnapshot(code, name, 0, false, "", 0, 0, "", 0, 0, "idle");
}
