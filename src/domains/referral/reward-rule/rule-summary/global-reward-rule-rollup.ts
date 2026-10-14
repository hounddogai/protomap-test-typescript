import * as text from "../../../../kit/text.js";

/** Where a global reward rule rollup is in its life cycle. */
export type GlobalRewardRuleRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global reward rule rollup as the reward rule team keeps it. */
export class GlobalRewardRuleRollup {
  code: string;
  title: string;
  campaignRef: string;
  revision: number;
  budget: number;
  country: string;
  status: GlobalRewardRuleRollupStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    revision: number,
    budget: number,
    country: string,
    status: GlobalRewardRuleRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.budget = budget;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardRuleRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRewardRuleRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward rule rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.revision * 100) / 100;
  }

  copy(): GlobalRewardRuleRollup {
    return new GlobalRewardRuleRollup(
      this.code,
      this.title,
      this.campaignRef,
      this.revision,
      this.budget,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global reward rule rollup in status idle. */
export function newGlobalRewardRuleRollup(code: string, title: string): GlobalRewardRuleRollup {
  return new GlobalRewardRuleRollup(code, title, "", 0, 0, "", "idle");
}
