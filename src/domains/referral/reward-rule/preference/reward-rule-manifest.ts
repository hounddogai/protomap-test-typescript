import * as text from "../../../../kit/text.js";

/** Where a reward rule manifest is in its life cycle. */
export type RewardRuleManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward rule manifest. Its code is unique within a tenant. */
export class RewardRuleManifest {
  code: string;
  label: string;
  contactEmail: string;
  currency: string;
  startsAt: number;
  description: string;
  threshold: number;
  locale: string;
  status: RewardRuleManifestStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    currency: string,
    startsAt: number,
    description: string,
    threshold: number,
    locale: string,
    status: RewardRuleManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.startsAt = startsAt;
    this.description = description;
    this.threshold = threshold;
    this.locale = locale;
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

  canMoveTo(next: RewardRuleManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.threshold + this.startsAt) * 100) / 100;
  }

  copy(): RewardRuleManifest {
    return new RewardRuleManifest(
      this.code,
      this.label,
      this.contactEmail,
      this.currency,
      this.startsAt,
      this.description,
      this.threshold,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule manifest in status draft. */
export function newRewardRuleManifest(code: string, label: string): RewardRuleManifest {
  return new RewardRuleManifest(code, label, "", "", 0, "", 0, "", "draft");
}
