import * as text from "../../../../kit/text.js";

/** Where a proof rollup is in its life cycle. */
export type ProofRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a proof rollup and its current status. */
export class ProofRollup {
  code: string;
  label: string;
  segment: string;
  unit: string;
  phone: string;
  score: number;
  status: ProofRollupStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    unit: string,
    phone: string,
    score: number,
    status: ProofRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.unit = unit;
    this.phone = phone;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ProofRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ProofRollup {
    return new ProofRollup(this.code, this.label, this.segment, this.unit, this.phone, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a proof rollup in status idle. */
export function newProofRollup(code: string, label: string): ProofRollup {
  return new ProofRollup(code, label, "", "", "", 0, "idle");
}
