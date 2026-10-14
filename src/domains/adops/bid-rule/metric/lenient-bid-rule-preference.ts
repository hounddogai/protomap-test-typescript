import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule preference is in its life cycle. */
export type LenientBidRulePreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient bid rule preference. Its code is unique within a tenant. */
export class LenientBidRulePreference {
  code: string;
  name: string;
  conversionRate: number;
  locale: string;
  description: string;
  channel: string;
  active: boolean;
  audienceId: string;
  quantity: number;
  status: LenientBidRulePreferenceStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    locale: string,
    description: string,
    channel: string,
    active: boolean,
    audienceId: string,
    quantity: number,
    status: LenientBidRulePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.description = description;
    this.channel = channel;
    this.active = active;
    this.audienceId = audienceId;
    this.quantity = quantity;
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

  canMoveTo(next: LenientBidRulePreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
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

  moveTo(next: LenientBidRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient bid rule preference"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate + this.quantity) * 100) / 100;
  }

  copy(): LenientBidRulePreference {
    return new LenientBidRulePreference(
      this.code,
      this.name,
      this.conversionRate,
      this.locale,
      this.description,
      this.channel,
      this.active,
      this.audienceId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient bid rule preference in status draft. */
export function newLenientBidRulePreference(code: string, name: string): LenientBidRulePreference {
  return new LenientBidRulePreference(code, name, 0, "", "", "", false, "", 0, "draft");
}
