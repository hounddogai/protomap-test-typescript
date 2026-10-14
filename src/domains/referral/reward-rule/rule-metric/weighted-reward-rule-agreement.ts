import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule agreement is in its life cycle. */
export type WeightedRewardRuleAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted reward rule agreement as the reward rule team keeps it. */
export class WeightedRewardRuleAgreement {
  code: string;
  name: string;
  reviewer: string;
  createdAt: number;
  clicks: number;
  maximum: number;
  pinned: boolean;
  title: string;
  revision: number;
  label: string;
  status: WeightedRewardRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    createdAt: number,
    clicks: number,
    maximum: number,
    pinned: boolean,
    title: string,
    revision: number,
    label: string,
    status: WeightedRewardRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.maximum = maximum;
    this.pinned = pinned;
    this.title = title;
    this.revision = revision;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedRewardRuleAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedRewardRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.createdAt + this.clicks) * 100) / 100;
  }

  copy(): WeightedRewardRuleAgreement {
    return new WeightedRewardRuleAgreement(
      this.code,
      this.name,
      this.reviewer,
      this.createdAt,
      this.clicks,
      this.maximum,
      this.pinned,
      this.title,
      this.revision,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted reward rule agreement in status planned. */
export function newWeightedRewardRuleAgreement(code: string, name: string): WeightedRewardRuleAgreement {
  return new WeightedRewardRuleAgreement(code, name, "", 0, 0, 0, false, "", 0, "", "planned");
}
