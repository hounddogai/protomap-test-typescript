import * as text from "../../../../kit/text.js";

/** Where a proof override is in its life cycle. */
export type ProofOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One proof override, with what the planners need to act on it. */
export class ProofOverride {
  code: string;
  title: string;
  version: number;
  channel: string;
  cohort: string;
  weight: number;
  rate: number;
  amount: number;
  cost: number;
  status: ProofOverrideStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    channel: string,
    cohort: string,
    weight: number,
    rate: number,
    amount: number,
    cost: number,
    status: ProofOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.channel = channel;
    this.cohort = cohort;
    this.weight = weight;
    this.rate = rate;
    this.amount = amount;
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

  canMoveTo(next: ProofOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ProofOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.cost * this.weight * 100) / 100;
  }

  copy(): ProofOverride {
    return new ProofOverride(
      this.code,
      this.title,
      this.version,
      this.channel,
      this.cohort,
      this.weight,
      this.rate,
      this.amount,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof override in status draft. */
export function newProofOverride(code: string, title: string): ProofOverride {
  return new ProofOverride(code, title, 0, "", "", 0, 0, 0, 0, "draft");
}
