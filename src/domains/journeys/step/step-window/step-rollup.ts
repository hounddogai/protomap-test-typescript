import * as text from "../../../../kit/text.js";

/** Where a step rollup is in its life cycle. */
export type StepRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A step rollup. Its code is unique within a tenant. */
export class StepRollup {
  code: string;
  name: string;
  variant: string;
  discount: number;
  clicks: number;
  score: number;
  maximum: number;
  createdAt: number;
  status: StepRollupStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    discount: number,
    clicks: number,
    score: number,
    maximum: number,
    createdAt: number,
    status: StepRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.discount = discount;
    this.clicks = clicks;
    this.score = score;
    this.maximum = maximum;
    this.createdAt = createdAt;
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

  canMoveTo(next: StepRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
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

  moveTo(next: StepRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round(this.score * this.maximum * 100) / 100;
  }

  copy(): StepRollup {
    return new StepRollup(
      this.code,
      this.name,
      this.variant,
      this.discount,
      this.clicks,
      this.score,
      this.maximum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step rollup in status proposed. */
export function newStepRollup(code: string, name: string): StepRollup {
  return new StepRollup(code, name, "", 0, 0, 0, 0, 0, "proposed");
}
