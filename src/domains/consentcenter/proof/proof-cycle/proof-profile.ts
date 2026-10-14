import * as text from "../../../../kit/text.js";

/** Where a proof profile is in its life cycle. */
export type ProofProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A proof profile. Its code is unique within a tenant. */
export class ProofProfile {
  code: string;
  label: string;
  variant: string;
  currency: string;
  name: string;
  graceDays: number;
  status: ProofProfileStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    currency: string,
    name: string,
    graceDays: number,
    status: ProofProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.currency = currency;
    this.name = name;
    this.graceDays = graceDays;
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

  canMoveTo(next: ProofProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): ProofProfile {
    return new ProofProfile(this.code, this.label, this.variant, this.currency, this.name, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a proof profile in status requested. */
export function newProofProfile(code: string, label: string): ProofProfile {
  return new ProofProfile(code, label, "", "", "", 0, "requested");
}
