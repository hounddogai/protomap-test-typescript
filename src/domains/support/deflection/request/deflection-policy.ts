import * as text from "../../../../kit/text.js";

/** Where a deflection policy is in its life cycle. */
export type DeflectionPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a deflection policy and its current status. */
export class DeflectionPolicy {
  code: string;
  name: string;
  clicks: number;
  retries: number;
  expiresAt: number;
  status: DeflectionPolicyStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    retries: number,
    expiresAt: number,
    status: DeflectionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.retries = retries;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.expiresAt + this.clicks) * 100) / 100;
  }

  copy(): DeflectionPolicy {
    return new DeflectionPolicy(this.code, this.name, this.clicks, this.retries, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection policy in status draft. */
export function newDeflectionPolicy(code: string, name: string): DeflectionPolicy {
  return new DeflectionPolicy(code, name, 0, 0, 0, "draft");
}
