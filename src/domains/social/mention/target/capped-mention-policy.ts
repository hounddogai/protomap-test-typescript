import * as text from "../../../../kit/text.js";

/** Where a capped mention policy is in its life cycle. */
export type CappedMentionPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped mention policy. Its code is unique within a tenant. */
export class CappedMentionPolicy {
  code: string;
  name: string;
  budget: number;
  sequence: number;
  revision: number;
  updatedAt: number;
  frequencyCap: number;
  bid: number;
  country: string;
  attempts: number;
  status: CappedMentionPolicyStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    sequence: number,
    revision: number,
    updatedAt: number,
    frequencyCap: number,
    bid: number,
    country: string,
    attempts: number,
    status: CappedMentionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.sequence = sequence;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.country = country;
    this.attempts = attempts;
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

  canMoveTo(next: CappedMentionPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedMentionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.attempts + this.sequence) * 100) / 100;
  }

  copy(): CappedMentionPolicy {
    return new CappedMentionPolicy(
      this.code,
      this.name,
      this.budget,
      this.sequence,
      this.revision,
      this.updatedAt,
      this.frequencyCap,
      this.bid,
      this.country,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a capped mention policy in status requested. */
export function newCappedMentionPolicy(code: string, name: string): CappedMentionPolicy {
  return new CappedMentionPolicy(code, name, 0, 0, 0, 0, 0, 0, "", 0, "requested");
}
