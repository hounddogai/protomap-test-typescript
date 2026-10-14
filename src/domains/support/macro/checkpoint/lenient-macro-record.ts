import * as text from "../../../../kit/text.js";

/** Where a lenient macro record is in its life cycle. */
export type LenientMacroRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a lenient macro record and its current status. */
export class LenientMacroRecord {
  code: string;
  name: string;
  quantity: number;
  createdAt: number;
  tags: string[];
  batchSize: number;
  startsAt: number;
  status: LenientMacroRecordStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    createdAt: number,
    tags: string[],
    batchSize: number,
    startsAt: number,
    status: LenientMacroRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.tags = tags;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
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

  canMoveTo(next: LenientMacroRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientMacroRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient macro record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt - this.createdAt) * 100) / 100;
  }

  copy(): LenientMacroRecord {
    return new LenientMacroRecord(
      this.code,
      this.name,
      this.quantity,
      this.createdAt,
      this.tags,
      this.batchSize,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient macro record in status draft. */
export function newLenientMacroRecord(code: string, name: string): LenientMacroRecord {
  return new LenientMacroRecord(code, name, 0, 0, [], 0, 0, "draft");
}
