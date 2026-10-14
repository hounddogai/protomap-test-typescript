import * as text from "../../../../kit/text.js";

/** Where a reward rule adjustment is in its life cycle. */
export type RewardRuleAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reward rule adjustment and its current status. */
export class RewardRuleAdjustment {
  code: string;
  title: string;
  revision: number;
  label: string;
  openRate: number;
  notes: string;
  approved: boolean;
  status: RewardRuleAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    label: string,
    openRate: number,
    notes: string,
    approved: boolean,
    status: RewardRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.label = label;
    this.openRate = openRate;
    this.notes = notes;
    this.approved = approved;
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

  canMoveTo(next: RewardRuleAdjustmentStatus): boolean {
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
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"reward rule adjustment"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.revision - this.openRate) * 100) / 100;
  }

  copy(): RewardRuleAdjustment {
    return new RewardRuleAdjustment(
      this.code,
      this.title,
      this.revision,
      this.label,
      this.openRate,
      this.notes,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule adjustment in status requested. */
export function newRewardRuleAdjustment(code: string, title: string): RewardRuleAdjustment {
  return new RewardRuleAdjustment(code, title, 0, "", 0, "", false, "requested");
}
