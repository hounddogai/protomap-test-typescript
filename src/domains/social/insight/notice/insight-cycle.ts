import * as text from "../../../../kit/text.js";

/** Where a insight cycle is in its life cycle. */
export type InsightCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A insight cycle as the insight team keeps it. */
export class InsightCycle {
  code: string;
  label: string;
  attempts: number;
  frequencyCap: number;
  retries: number;
  ratio: number;
  status: InsightCycleStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    frequencyCap: number,
    retries: number,
    ratio: number,
    status: InsightCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.retries = retries;
    this.ratio = ratio;
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

  canMoveTo(next: InsightCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.attempts + this.retries) * 100) / 100;
  }

  copy(): InsightCycle {
    return new InsightCycle(
      this.code,
      this.label,
      this.attempts,
      this.frequencyCap,
      this.retries,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a insight cycle in status requested. */
export function newInsightCycle(code: string, label: string): InsightCycle {
  return new InsightCycle(code, label, 0, 0, 0, 0, "requested");
}
