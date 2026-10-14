import * as text from "../../../../kit/text.js";

/** Where a lenient reward rule checkpoint is in its life cycle. */
export type LenientRewardRuleCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient reward rule checkpoint. Its code is unique within a tenant. */
export class LenientRewardRuleCheckpoint {
  code: string;
  title: string;
  maximum: number;
  amount: number;
  impressions: number;
  frequencyCap: number;
  floorValue: number;
  tags: string[];
  approved: boolean;
  visible: boolean;
  status: LenientRewardRuleCheckpointStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    amount: number,
    impressions: number,
    frequencyCap: number,
    floorValue: number,
    tags: string[],
    approved: boolean,
    visible: boolean,
    status: LenientRewardRuleCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.amount = amount;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.tags = tags;
    this.approved = approved;
    this.visible = visible;
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

  canMoveTo(next: LenientRewardRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientRewardRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.impressions * this.amount * 100) / 100;
  }

  copy(): LenientRewardRuleCheckpoint {
    return new LenientRewardRuleCheckpoint(
      this.code,
      this.title,
      this.maximum,
      this.amount,
      this.impressions,
      this.frequencyCap,
      this.floorValue,
      this.tags,
      this.approved,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient reward rule checkpoint in status draft. */
export function newLenientRewardRuleCheckpoint(code: string, title: string): LenientRewardRuleCheckpoint {
  return new LenientRewardRuleCheckpoint(code, title, 0, 0, 0, 0, 0, [], false, false, "draft");
}
