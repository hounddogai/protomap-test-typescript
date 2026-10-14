import * as text from "../../../../kit/text.js";

/** Where a proof bundle is in its life cycle. */
export type ProofBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One proof bundle, with what the planners need to act on it. */
export class ProofBundle {
  code: string;
  name: string;
  segment: string;
  currency: string;
  ceiling: number;
  status: ProofBundleStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    currency: string,
    ceiling: number,
    status: ProofBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.currency = currency;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ProofBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): ProofBundle {
    return new ProofBundle(this.code, this.name, this.segment, this.currency, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a proof bundle in status planned. */
export function newProofBundle(code: string, name: string): ProofBundle {
  return new ProofBundle(code, name, "", "", 0, "planned");
}
