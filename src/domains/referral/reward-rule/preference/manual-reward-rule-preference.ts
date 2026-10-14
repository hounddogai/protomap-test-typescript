import * as text from "../../../../kit/text.js";

/** Where a manual reward rule preference is in its life cycle. */
export type ManualRewardRulePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual reward rule preference as the reward rule team keeps it. */
export class ManualRewardRulePreference {
  code: string;
  label: string;
  phone: string;
  revision: number;
  limit: number;
  status: ManualRewardRulePreferenceStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    revision: number,
    limit: number,
    status: ManualRewardRulePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.revision = revision;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRewardRulePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRewardRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.revision + this.limit) * 100) / 100;
  }

  copy(): ManualRewardRulePreference {
    return new ManualRewardRulePreference(this.code, this.label, this.phone, this.revision, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual reward rule preference in status proposed. */
export function newManualRewardRulePreference(code: string, label: string): ManualRewardRulePreference {
  return new ManualRewardRulePreference(code, label, "", 0, 0, "proposed");
}
