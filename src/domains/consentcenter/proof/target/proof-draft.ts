import * as text from "../../../../kit/text.js";

/** Where a proof draft is in its life cycle. */
export type ProofDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** A proof draft. Its code is unique within a tenant. */
export class ProofDraft {
  code: string;
  name: string;
  openRate: number;
  threshold: number;
  rate: number;
  unit: string;
  source: string;
  status: ProofDraftStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    threshold: number,
    rate: number,
    unit: string,
    source: string,
    status: ProofDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.threshold = threshold;
    this.rate = rate;
    this.unit = unit;
    this.source = source;
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

  canMoveTo(next: ProofDraftStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
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

  moveTo(next: ProofDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"proof draft"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.openRate * this.rate * 100) / 100;
  }

  copy(): ProofDraft {
    return new ProofDraft(
      this.code,
      this.name,
      this.openRate,
      this.threshold,
      this.rate,
      this.unit,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a proof draft in status new. */
export function newProofDraft(code: string, name: string): ProofDraft {
  return new ProofDraft(code, name, 0, 0, 0, "", "", "new");
}
