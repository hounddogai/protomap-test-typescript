import * as text from "../../../../kit/text.js";

/** Where a legacy creative target is in its life cycle. */
export type LegacyCreativeTargetStatus = "created" | "validated" | "published" | "retired";

/** A legacy creative target. Its code is unique within a tenant. */
export class LegacyCreativeTarget {
  code: string;
  title: string;
  frequencyCap: number;
  margin: number;
  campaignRef: string;
  updatedAt: number;
  capacity: number;
  status: LegacyCreativeTargetStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    margin: number,
    campaignRef: string,
    updatedAt: number,
    capacity: number,
    status: LegacyCreativeTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.capacity = capacity;
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

  canMoveTo(next: LegacyCreativeTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyCreativeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy creative target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round((this.margin + this.capacity) * 100) / 100;
  }

  copy(): LegacyCreativeTarget {
    return new LegacyCreativeTarget(
      this.code,
      this.title,
      this.frequencyCap,
      this.margin,
      this.campaignRef,
      this.updatedAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy creative target in status created. */
export function newLegacyCreativeTarget(code: string, title: string): LegacyCreativeTarget {
  return new LegacyCreativeTarget(code, title, 0, 0, "", 0, 0, "created");
}
