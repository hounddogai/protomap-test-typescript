/**
 * The weighted reward rule preference records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule preference is in its life cycle. */
export type WeightedRewardRulePreferenceStatus = "created" | "validated" | "published" | "retired";

/** A weighted reward rule preference. Its code is unique within a tenant. */
export class WeightedRewardRulePreference {
  code: string;
  title: string;
  updatedAt: number;
  phone: string;
  externalRef: string;
  status: WeightedRewardRulePreferenceStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    phone: string,
    externalRef: string,
    status: WeightedRewardRulePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.externalRef = externalRef;
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

  canMoveTo(next: WeightedRewardRulePreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedRewardRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted reward rule preference"} ${this.code}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): WeightedRewardRulePreference {
    return new WeightedRewardRulePreference(
      this.code,
      this.title,
      this.updatedAt,
      this.phone,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted reward rule preference in status created. */
export function newWeightedRewardRulePreference(code: string, title: string): WeightedRewardRulePreference {
  return new WeightedRewardRulePreference(code, title, 0, "", "", "created");
}
