import * as text from "../../../../kit/text.js";

/** Where a tiered cohort adjustment is in its life cycle. */
export type TieredCohortAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered cohort adjustment. Its code is unique within a tenant. */
export class TieredCohortAdjustment {
  code: string;
  name: string;
  ceiling: number;
  createdAt: number;
  channel: string;
  description: string;
  quantity: number;
  status: TieredCohortAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    createdAt: number,
    channel: string,
    description: string,
    quantity: number,
    status: TieredCohortAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.channel = channel;
    this.description = description;
    this.quantity = quantity;
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

  canMoveTo(next: TieredCohortAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredCohortAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered cohort adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered cohort adjustment"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.ceiling + this.quantity) * 100) / 100;
  }

  copy(): TieredCohortAdjustment {
    return new TieredCohortAdjustment(
      this.code,
      this.name,
      this.ceiling,
      this.createdAt,
      this.channel,
      this.description,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered cohort adjustment in status new. */
export function newTieredCohortAdjustment(code: string, name: string): TieredCohortAdjustment {
  return new TieredCohortAdjustment(code, name, 0, 0, "", "", 0, "new");
}
