import * as text from "../../../../kit/text.js";

/** Where a capped suppression record is in its life cycle. */
export type CappedSuppressionRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a capped suppression record and its current status. */
export class CappedSuppressionRecord {
  code: string;
  name: string;
  ownerId: string;
  floorValue: number;
  quantity: number;
  ratio: number;
  status: CappedSuppressionRecordStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    floorValue: number,
    quantity: number,
    ratio: number,
    status: CappedSuppressionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.ratio = ratio;
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

  canMoveTo(next: CappedSuppressionRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedSuppressionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped suppression record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.floorValue - this.ratio) * 100) / 100;
  }

  copy(): CappedSuppressionRecord {
    return new CappedSuppressionRecord(
      this.code,
      this.name,
      this.ownerId,
      this.floorValue,
      this.quantity,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped suppression record in status created. */
export function newCappedSuppressionRecord(code: string, name: string): CappedSuppressionRecord {
  return new CappedSuppressionRecord(code, name, "", 0, 0, 0, "created");
}
