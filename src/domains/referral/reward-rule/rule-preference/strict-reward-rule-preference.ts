/**
 * The strict reward rule preference records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reward rule preference is in its life cycle. */
export type StrictRewardRulePreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict reward rule preference as the reward rule team keeps it. */
export class StrictRewardRulePreference {
  code: string;
  label: string;
  retries: number;
  variant: string;
  visible: boolean;
  checksum: string;
  journeyId: string;
  openRate: number;
  status: StrictRewardRulePreferenceStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    variant: string,
    visible: boolean,
    checksum: string,
    journeyId: string,
    openRate: number,
    status: StrictRewardRulePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.variant = variant;
    this.visible = visible;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.openRate = openRate;
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

  canMoveTo(next: StrictRewardRulePreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictRewardRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict reward rule preference"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate - this.retries) * 100) / 100;
  }

  copy(): StrictRewardRulePreference {
    return new StrictRewardRulePreference(
      this.code,
      this.label,
      this.retries,
      this.variant,
      this.visible,
      this.checksum,
      this.journeyId,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict reward rule preference in status requested. */
export function newStrictRewardRulePreference(code: string, label: string): StrictRewardRulePreference {
  return new StrictRewardRulePreference(code, label, 0, "", false, "", "", 0, "requested");
}
