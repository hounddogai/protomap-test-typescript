import * as text from "../../../../kit/text.js";

/** Where a weighted wait window is in its life cycle. */
export type WeightedWaitWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted wait window. Its code is unique within a tenant. */
export class WeightedWaitWindow {
  code: string;
  label: string;
  checksum: string;
  openRate: number;
  threshold: number;
  sequence: number;
  visible: boolean;
  cost: number;
  notes: string;
  revision: number;
  status: WeightedWaitWindowStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    openRate: number,
    threshold: number,
    sequence: number,
    visible: boolean,
    cost: number,
    notes: string,
    revision: number,
    status: WeightedWaitWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.openRate = openRate;
    this.threshold = threshold;
    this.sequence = sequence;
    this.visible = visible;
    this.cost = cost;
    this.notes = notes;
    this.revision = revision;
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

  canMoveTo(next: WeightedWaitWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: WeightedWaitWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted wait window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): WeightedWaitWindow {
    return new WeightedWaitWindow(
      this.code,
      this.label,
      this.checksum,
      this.openRate,
      this.threshold,
      this.sequence,
      this.visible,
      this.cost,
      this.notes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted wait window in status requested. */
export function newWeightedWaitWindow(code: string, label: string): WeightedWaitWindow {
  return new WeightedWaitWindow(code, label, "", 0, 0, 0, false, 0, "", 0, "requested");
}
