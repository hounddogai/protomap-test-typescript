import * as text from "../../../../kit/text.js";

/** Where a csat metric is in its life cycle. */
export type CsatMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a csat metric and its current status. */
export class CsatMetric {
  code: string;
  name: string;
  quantity: number;
  score: number;
  budget: number;
  attempts: number;
  status: CsatMetricStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    score: number,
    budget: number,
    attempts: number,
    status: CsatMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.score = score;
    this.budget = budget;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CsatMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.score + this.attempts) * 100) / 100;
  }

  copy(): CsatMetric {
    return new CsatMetric(this.code, this.name, this.quantity, this.score, this.budget, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a csat metric in status requested. */
export function newCsatMetric(code: string, name: string): CsatMetric {
  return new CsatMetric(code, name, 0, 0, 0, 0, "requested");
}
