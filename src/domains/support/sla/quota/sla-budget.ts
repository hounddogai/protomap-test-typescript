import * as text from "../../../../kit/text.js";

/** Where a sla budget is in its life cycle. */
export type SlaBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A sla budget. Its code is unique within a tenant. */
export class SlaBudget {
  code: string;
  name: string;
  cost: number;
  expiresAt: number;
  utmSource: string;
  sequence: number;
  status: SlaBudgetStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    expiresAt: number,
    utmSource: string,
    sequence: number,
    status: SlaBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.sequence = sequence;
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

  canMoveTo(next: SlaBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round((this.cost + this.expiresAt) * 100) / 100;
  }

  copy(): SlaBudget {
    return new SlaBudget(this.code, this.name, this.cost, this.expiresAt, this.utmSource, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a sla budget in status requested. */
export function newSlaBudget(code: string, name: string): SlaBudget {
  return new SlaBudget(code, name, 0, 0, "", 0, "requested");
}
