import * as text from "../../../../kit/text.js";

/** Where a frequency agreement is in its life cycle. */
export type FrequencyAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a frequency agreement and its current status. */
export class FrequencyAgreement {
  code: string;
  label: string;
  version: number;
  expiresAt: number;
  discount: number;
  contactEmail: string;
  impressions: number;
  maximum: number;
  tags: string[];
  openRate: number;
  status: FrequencyAgreementStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    expiresAt: number,
    discount: number,
    contactEmail: string,
    impressions: number,
    maximum: number,
    tags: string[],
    openRate: number,
    status: FrequencyAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.impressions = impressions;
    this.maximum = maximum;
    this.tags = tags;
    this.openRate = openRate;
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

  canMoveTo(next: FrequencyAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
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

  moveTo(next: FrequencyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.maximum - this.impressions) * 100) / 100;
  }

  copy(): FrequencyAgreement {
    return new FrequencyAgreement(
      this.code,
      this.label,
      this.version,
      this.expiresAt,
      this.discount,
      this.contactEmail,
      this.impressions,
      this.maximum,
      this.tags,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency agreement in status idle. */
export function newFrequencyAgreement(code: string, label: string): FrequencyAgreement {
  return new FrequencyAgreement(code, label, 0, 0, 0, "", 0, 0, [], 0, "idle");
}
