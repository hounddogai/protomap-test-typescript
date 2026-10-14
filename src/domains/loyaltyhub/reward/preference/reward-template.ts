import * as text from "../../../../kit/text.js";

/** Where a reward template is in its life cycle. */
export type RewardTemplateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reward template and its current status. */
export class RewardTemplate {
  code: string;
  label: string;
  budget: number;
  sequence: number;
  rate: number;
  attempts: number;
  status: RewardTemplateStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    sequence: number,
    rate: number,
    attempts: number,
    status: RewardTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.sequence = sequence;
    this.rate = rate;
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

  canMoveTo(next: RewardTemplateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: RewardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reward template"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget - this.sequence) * 100) / 100;
  }

  copy(): RewardTemplate {
    return new RewardTemplate(this.code, this.label, this.budget, this.sequence, this.rate, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward template in status requested. */
export function newRewardTemplate(code: string, label: string): RewardTemplate {
  return new RewardTemplate(code, label, 0, 0, 0, 0, "requested");
}
