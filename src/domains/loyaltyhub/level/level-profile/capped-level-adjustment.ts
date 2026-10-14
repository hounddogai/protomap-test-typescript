import * as text from "../../../../kit/text.js";

/** Where a capped level adjustment is in its life cycle. */
export type CappedLevelAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped level adjustment. Its code is unique within a tenant. */
export class CappedLevelAdjustment {
  code: string;
  name: string;
  revision: number;
  phone: string;
  audienceId: string;
  ratio: number;
  timezone: string;
  budget: number;
  status: CappedLevelAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    phone: string,
    audienceId: string,
    ratio: number,
    timezone: string,
    budget: number,
    status: CappedLevelAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.phone = phone;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.timezone = timezone;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedLevelAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedLevelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped level adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.revision - this.budget) * 100) / 100;
  }

  copy(): CappedLevelAdjustment {
    return new CappedLevelAdjustment(
      this.code,
      this.name,
      this.revision,
      this.phone,
      this.audienceId,
      this.ratio,
      this.timezone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped level adjustment in status new. */
export function newCappedLevelAdjustment(code: string, name: string): CappedLevelAdjustment {
  return new CappedLevelAdjustment(code, name, 0, "", "", 0, "", 0, "new");
}
