import * as text from "../../../../kit/text.js";

/** Where a bounce preference is in its life cycle. */
export type BouncePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bounce preference as the bounce team keeps it. */
export class BouncePreference {
  code: string;
  label: string;
  locale: string;
  budget: number;
  openRate: number;
  campaignRef: string;
  createdAt: number;
  channel: string;
  status: BouncePreferenceStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    budget: number,
    openRate: number,
    campaignRef: string,
    createdAt: number,
    channel: string,
    status: BouncePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budget = budget;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.channel = channel;
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

  canMoveTo(next: BouncePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bounce preference"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.createdAt + this.budget) * 100) / 100;
  }

  copy(): BouncePreference {
    return new BouncePreference(
      this.code,
      this.label,
      this.locale,
      this.budget,
      this.openRate,
      this.campaignRef,
      this.createdAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bounce preference in status proposed. */
export function newBouncePreference(code: string, label: string): BouncePreference {
  return new BouncePreference(code, label, "", 0, 0, "", 0, "", "proposed");
}
