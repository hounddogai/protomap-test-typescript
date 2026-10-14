import * as text from "../../../../kit/text.js";

/** Where a capped proof rule is in its life cycle. */
export type CappedProofRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped proof rule. Its code is unique within a tenant. */
export class CappedProofRule {
  code: string;
  label: string;
  currency: string;
  score: number;
  version: number;
  timezone: string;
  openRate: number;
  quantity: number;
  region: string;
  status: CappedProofRuleStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    score: number,
    version: number,
    timezone: string,
    openRate: number,
    quantity: number,
    region: string,
    status: CappedProofRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.score = score;
    this.version = version;
    this.timezone = timezone;
    this.openRate = openRate;
    this.quantity = quantity;
    this.region = region;
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

  canMoveTo(next: CappedProofRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
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

  moveTo(next: CappedProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.quantity + this.version) * 100) / 100;
  }

  copy(): CappedProofRule {
    return new CappedProofRule(
      this.code,
      this.label,
      this.currency,
      this.score,
      this.version,
      this.timezone,
      this.openRate,
      this.quantity,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped proof rule in status requested. */
export function newCappedProofRule(code: string, label: string): CappedProofRule {
  return new CappedProofRule(code, label, "", 0, 0, "", 0, 0, "", "requested");
}
