import * as text from "../../../../kit/text.js";

/** Where a global branch policy is in its life cycle. */
export type GlobalBranchPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global branch policy. Its code is unique within a tenant. */
export class GlobalBranchPolicy {
  code: string;
  name: string;
  locale: string;
  budget: number;
  channel: string;
  weight: number;
  approved: boolean;
  status: GlobalBranchPolicyStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    budget: number,
    channel: string,
    weight: number,
    approved: boolean,
    status: GlobalBranchPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.budget = budget;
    this.channel = channel;
    this.weight = weight;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalBranchPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalBranchPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.budget + this.weight) * 100) / 100;
  }

  copy(): GlobalBranchPolicy {
    return new GlobalBranchPolicy(
      this.code,
      this.name,
      this.locale,
      this.budget,
      this.channel,
      this.weight,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global branch policy in status proposed. */
export function newGlobalBranchPolicy(code: string, name: string): GlobalBranchPolicy {
  return new GlobalBranchPolicy(code, name, "", 0, "", 0, false, "proposed");
}
