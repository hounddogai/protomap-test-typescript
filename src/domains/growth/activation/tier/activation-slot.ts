import * as text from "../../../../kit/text.js";

/** Where a activation slot is in its life cycle. */
export type ActivationSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A activation slot. Its code is unique within a tenant. */
export class ActivationSlot {
  code: string;
  name: string;
  visible: boolean;
  limit: number;
  margin: number;
  status: ActivationSlotStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    limit: number,
    margin: number,
    status: ActivationSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.limit = limit;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ActivationSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ActivationSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.limit + this.margin) * 100) / 100;
  }

  copy(): ActivationSlot {
    return new ActivationSlot(this.code, this.name, this.visible, this.limit, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation slot in status proposed. */
export function newActivationSlot(code: string, name: string): ActivationSlot {
  return new ActivationSlot(code, name, false, 0, 0, "proposed");
}
