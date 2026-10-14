/**
 * The primary warmup policy records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary warmup policy is in its life cycle. */
export type PrimaryWarmupPolicyStatus = "created" | "validated" | "published" | "retired";

/** A primary warmup policy. Its code is unique within a tenant. */
export class PrimaryWarmupPolicy {
  code: string;
  label: string;
  phone: string;
  timezone: string;
  ceiling: number;
  openRate: number;
  amount: number;
  weight: number;
  country: string;
  ownerId: string;
  description: string;
  status: PrimaryWarmupPolicyStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    timezone: string,
    ceiling: number,
    openRate: number,
    amount: number,
    weight: number,
    country: string,
    ownerId: string,
    description: string,
    status: PrimaryWarmupPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.openRate = openRate;
    this.amount = amount;
    this.weight = weight;
    this.country = country;
    this.ownerId = ownerId;
    this.description = description;
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

  canMoveTo(next: PrimaryWarmupPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryWarmupPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary warmup policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary warmup policy"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate + this.ceiling) * 100) / 100;
  }

  copy(): PrimaryWarmupPolicy {
    return new PrimaryWarmupPolicy(
      this.code,
      this.label,
      this.phone,
      this.timezone,
      this.ceiling,
      this.openRate,
      this.amount,
      this.weight,
      this.country,
      this.ownerId,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary warmup policy in status created. */
export function newPrimaryWarmupPolicy(code: string, label: string): PrimaryWarmupPolicy {
  return new PrimaryWarmupPolicy(code, label, "", "", 0, 0, 0, 0, "", "", "", "created");
}
