import * as text from "../../../../kit/text.js";

/** Where a approval slot is in its life cycle. */
export type ApprovalSlotStatus = "created" | "validated" | "published" | "retired";

/** The record of a approval slot and its current status. */
export class ApprovalSlot {
  code: string;
  name: string;
  active: boolean;
  margin: number;
  ratio: number;
  weight: number;
  archived: boolean;
  quantity: number;
  status: ApprovalSlotStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    margin: number,
    ratio: number,
    weight: number,
    archived: boolean,
    quantity: number,
    status: ApprovalSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.margin = margin;
    this.ratio = ratio;
    this.weight = weight;
    this.archived = archived;
    this.quantity = quantity;
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

  canMoveTo(next: ApprovalSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ApprovalSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.quantity - this.ratio) * 100) / 100;
  }

  copy(): ApprovalSlot {
    return new ApprovalSlot(
      this.code,
      this.name,
      this.active,
      this.margin,
      this.ratio,
      this.weight,
      this.archived,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval slot in status created. */
export function newApprovalSlot(code: string, name: string): ApprovalSlot {
  return new ApprovalSlot(code, name, false, 0, 0, 0, false, 0, "created");
}
