import * as text from "../../../../kit/text.js";

/** Where a deflection rollup is in its life cycle. */
export type DeflectionRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A deflection rollup. Its code is unique within a tenant. */
export class DeflectionRollup {
  code: string;
  label: string;
  cost: number;
  active: boolean;
  startsAt: number;
  rate: number;
  externalRef: string;
  status: DeflectionRollupStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    active: boolean,
    startsAt: number,
    rate: number,
    externalRef: string,
    status: DeflectionRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.active = active;
    this.startsAt = startsAt;
    this.rate = rate;
    this.externalRef = externalRef;
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

  canMoveTo(next: DeflectionRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.rate * this.cost * 100) / 100;
  }

  copy(): DeflectionRollup {
    return new DeflectionRollup(
      this.code,
      this.label,
      this.cost,
      this.active,
      this.startsAt,
      this.rate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection rollup in status requested. */
export function newDeflectionRollup(code: string, label: string): DeflectionRollup {
  return new DeflectionRollup(code, label, 0, false, 0, 0, "", "requested");
}
