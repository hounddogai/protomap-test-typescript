import * as text from "../../../../kit/text.js";

/** Where a funnel checkpoint is in its life cycle. */
export type FunnelCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a funnel checkpoint and its current status. */
export class FunnelCheckpoint {
  code: string;
  label: string;
  discount: number;
  maximum: number;
  checksum: string;
  endsAt: number;
  status: FunnelCheckpointStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    maximum: number,
    checksum: string,
    endsAt: number,
    status: FunnelCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.maximum = maximum;
    this.checksum = checksum;
    this.endsAt = endsAt;
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

  canMoveTo(next: FunnelCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FunnelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.endsAt + this.maximum) * 100) / 100;
  }

  copy(): FunnelCheckpoint {
    return new FunnelCheckpoint(
      this.code,
      this.label,
      this.discount,
      this.maximum,
      this.checksum,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a funnel checkpoint in status planned. */
export function newFunnelCheckpoint(code: string, label: string): FunnelCheckpoint {
  return new FunnelCheckpoint(code, label, 0, 0, "", 0, "planned");
}
