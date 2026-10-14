import * as text from "../../../../kit/text.js";

/** Where a reward rule group is in its life cycle. */
export type RewardRuleGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reward rule group, with what the planners need to act on it. */
export class RewardRuleGroup {
  code: string;
  name: string;
  createdAt: number;
  locale: string;
  archived: boolean;
  unit: string;
  revision: number;
  discount: number;
  openRate: number;
  status: RewardRuleGroupStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    locale: string,
    archived: boolean,
    unit: string,
    revision: number,
    discount: number,
    openRate: number,
    status: RewardRuleGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.locale = locale;
    this.archived = archived;
    this.unit = unit;
    this.revision = revision;
    this.discount = discount;
    this.openRate = openRate;
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

  canMoveTo(next: RewardRuleGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"reward rule group"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.revision + this.createdAt) * 100) / 100;
  }

  copy(): RewardRuleGroup {
    return new RewardRuleGroup(
      this.code,
      this.name,
      this.createdAt,
      this.locale,
      this.archived,
      this.unit,
      this.revision,
      this.discount,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule group in status draft. */
export function newRewardRuleGroup(code: string, name: string): RewardRuleGroup {
  return new RewardRuleGroup(code, name, 0, "", false, "", 0, 0, 0, "draft");
}
