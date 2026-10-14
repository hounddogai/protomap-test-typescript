import * as text from "../../../../kit/text.js";

/** Where a primary pacing variance is in its life cycle. */
export type PrimaryPacingVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary pacing variance as the pacing team keeps it. */
export class PrimaryPacingVariance {
  code: string;
  name: string;
  budget: number;
  openRate: number;
  source: string;
  status: PrimaryPacingVarianceStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    openRate: number,
    source: string,
    status: PrimaryPacingVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.openRate = openRate;
    this.source = source;
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

  canMoveTo(next: PrimaryPacingVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPacingVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.openRate * 100) / 100;
  }

  copy(): PrimaryPacingVariance {
    return new PrimaryPacingVariance(this.code, this.name, this.budget, this.openRate, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary pacing variance in status proposed. */
export function newPrimaryPacingVariance(code: string, name: string): PrimaryPacingVariance {
  return new PrimaryPacingVariance(code, name, 0, 0, "", "proposed");
}
