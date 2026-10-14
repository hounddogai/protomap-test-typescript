import * as text from "../../../../kit/text.js";

/** Where a proof batch is in its life cycle. */
export type ProofBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A proof batch as the proof team keeps it. */
export class ProofBatch {
  code: string;
  label: string;
  retries: number;
  title: string;
  createdAt: number;
  name: string;
  status: ProofBatchStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    title: string,
    createdAt: number,
    name: string,
    status: ProofBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.title = title;
    this.createdAt = createdAt;
    this.name = name;
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

  canMoveTo(next: ProofBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
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

  moveTo(next: ProofBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.retries + this.createdAt) * 100) / 100;
  }

  copy(): ProofBatch {
    return new ProofBatch(this.code, this.label, this.retries, this.title, this.createdAt, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a proof batch in status requested. */
export function newProofBatch(code: string, label: string): ProofBatch {
  return new ProofBatch(code, label, 0, "", 0, "", "requested");
}
