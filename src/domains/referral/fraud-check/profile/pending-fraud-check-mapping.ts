import * as text from "../../../../kit/text.js";

/** Where a pending fraud check mapping is in its life cycle. */
export type PendingFraudCheckMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One pending fraud check mapping, with what the planners need to act on it. */
export class PendingFraudCheckMapping {
  code: string;
  label: string;
  graceDays: number;
  ownerId: string;
  margin: number;
  visible: boolean;
  cost: number;
  status: PendingFraudCheckMappingStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    ownerId: string,
    margin: number,
    visible: boolean,
    cost: number,
    status: PendingFraudCheckMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.margin = margin;
    this.visible = visible;
    this.cost = cost;
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

  canMoveTo(next: PendingFraudCheckMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingFraudCheckMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending fraud check mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.graceDays - this.cost) * 100) / 100;
  }

  copy(): PendingFraudCheckMapping {
    return new PendingFraudCheckMapping(
      this.code,
      this.label,
      this.graceDays,
      this.ownerId,
      this.margin,
      this.visible,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending fraud check mapping in status draft. */
export function newPendingFraudCheckMapping(code: string, label: string): PendingFraudCheckMapping {
  return new PendingFraudCheckMapping(code, label, 0, "", 0, false, 0, "draft");
}
