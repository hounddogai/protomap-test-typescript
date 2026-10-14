import * as text from "../../../../kit/text.js";

/** Where a tiered model policy is in its life cycle. */
export type TieredModelPolicyStatus = "created" | "validated" | "published" | "retired";

/** A tiered model policy. Its code is unique within a tenant. */
export class TieredModelPolicy {
  code: string;
  name: string;
  cost: number;
  cohort: string;
  segment: string;
  bid: number;
  attempts: number;
  revision: number;
  threshold: number;
  status: TieredModelPolicyStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    cohort: string,
    segment: string,
    bid: number,
    attempts: number,
    revision: number,
    threshold: number,
    status: TieredModelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.cohort = cohort;
    this.segment = segment;
    this.bid = bid;
    this.attempts = attempts;
    this.revision = revision;
    this.threshold = threshold;
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

  canMoveTo(next: TieredModelPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredModelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered model policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.revision * this.bid * 100) / 100;
  }

  copy(): TieredModelPolicy {
    return new TieredModelPolicy(
      this.code,
      this.name,
      this.cost,
      this.cohort,
      this.segment,
      this.bid,
      this.attempts,
      this.revision,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered model policy in status created. */
export function newTieredModelPolicy(code: string, name: string): TieredModelPolicy {
  return new TieredModelPolicy(code, name, 0, "", "", 0, 0, 0, 0, "created");
}
