import * as text from "../../../../kit/text.js";

/** Where a regional path policy is in its life cycle. */
export type RegionalPathPolicyStatus = "created" | "validated" | "published" | "retired";

/** One regional path policy, with what the planners need to act on it. */
export class RegionalPathPolicy {
  code: string;
  label: string;
  contactEmail: string;
  ceiling: number;
  ratio: number;
  status: RegionalPathPolicyStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    ceiling: number,
    ratio: number,
    status: RegionalPathPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.ceiling = ceiling;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPathPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPathPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional path policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.ratio + this.ceiling) * 100) / 100;
  }

  copy(): RegionalPathPolicy {
    return new RegionalPathPolicy(this.code, this.label, this.contactEmail, this.ceiling, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional path policy in status created. */
export function newRegionalPathPolicy(code: string, label: string): RegionalPathPolicy {
  return new RegionalPathPolicy(code, label, "", 0, 0, "created");
}
