import * as text from "../../../../kit/text.js";

/** Where a scheduled reward rule policy is in its life cycle. */
export type ScheduledRewardRulePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled reward rule policy as the reward rule team keeps it. */
export class ScheduledRewardRulePolicy {
  code: string;
  label: string;
  pinned: boolean;
  locale: string;
  notes: string;
  attributes: Map<string, string>;
  amount: number;
  status: ScheduledRewardRulePolicyStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    locale: string,
    notes: string,
    attributes: Map<string, string>,
    amount: number,
    status: ScheduledRewardRulePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.locale = locale;
    this.notes = notes;
    this.attributes = attributes;
    this.amount = amount;
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

  canMoveTo(next: ScheduledRewardRulePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledRewardRulePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled reward rule policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ScheduledRewardRulePolicy {
    return new ScheduledRewardRulePolicy(
      this.code,
      this.label,
      this.pinned,
      this.locale,
      this.notes,
      this.attributes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled reward rule policy in status requested. */
export function newScheduledRewardRulePolicy(code: string, label: string): ScheduledRewardRulePolicy {
  return new ScheduledRewardRulePolicy(code, label, false, "", "", new Map<string, string>(), 0, "requested");
}
