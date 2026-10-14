import * as text from "../../../../kit/text.js";

/** Where a mention tier is in its life cycle. */
export type MentionTierStatus = "requested" | "granted" | "revoked" | "expired";

/** One mention tier, with what the planners need to act on it. */
export class MentionTier {
  code: string;
  name: string;
  amount: number;
  quantity: number;
  cohort: string;
  retries: number;
  label: string;
  channel: string;
  conversionRate: number;
  timezone: string;
  version: number;
  status: MentionTierStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    quantity: number,
    cohort: string,
    retries: number,
    label: string,
    channel: string,
    conversionRate: number,
    timezone: string,
    version: number,
    status: MentionTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.quantity = quantity;
    this.cohort = cohort;
    this.retries = retries;
    this.label = label;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.version = version;
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

  canMoveTo(next: MentionTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.retries - this.quantity) * 100) / 100;
  }

  copy(): MentionTier {
    return new MentionTier(
      this.code,
      this.name,
      this.amount,
      this.quantity,
      this.cohort,
      this.retries,
      this.label,
      this.channel,
      this.conversionRate,
      this.timezone,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention tier in status requested. */
export function newMentionTier(code: string, name: string): MentionTier {
  return new MentionTier(code, name, 0, 0, "", 0, "", "", 0, "", 0, "requested");
}
