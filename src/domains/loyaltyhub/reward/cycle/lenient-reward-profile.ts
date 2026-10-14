import * as text from "../../../../kit/text.js";

/** Where a lenient reward profile is in its life cycle. */
export type LenientRewardProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient reward profile as the reward team keeps it. */
export class LenientRewardProfile {
  code: string;
  label: string;
  segment: string;
  score: number;
  source: string;
  createdAt: number;
  approved: boolean;
  priority: number;
  sequence: number;
  amount: number;
  phone: string;
  status: LenientRewardProfileStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    score: number,
    source: string,
    createdAt: number,
    approved: boolean,
    priority: number,
    sequence: number,
    amount: number,
    phone: string,
    status: LenientRewardProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.score = score;
    this.source = source;
    this.createdAt = createdAt;
    this.approved = approved;
    this.priority = priority;
    this.sequence = sequence;
    this.amount = amount;
    this.phone = phone;
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

  canMoveTo(next: LenientRewardProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientRewardProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.score - this.sequence) * 100) / 100;
  }

  copy(): LenientRewardProfile {
    return new LenientRewardProfile(
      this.code,
      this.label,
      this.segment,
      this.score,
      this.source,
      this.createdAt,
      this.approved,
      this.priority,
      this.sequence,
      this.amount,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient reward profile in status requested. */
export function newLenientRewardProfile(code: string, label: string): LenientRewardProfile {
  return new LenientRewardProfile(code, label, "", 0, "", 0, false, 0, 0, 0, "", "requested");
}
