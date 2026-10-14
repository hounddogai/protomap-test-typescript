import * as text from "../../../../kit/text.js";

/** Where a global fraud check preference is in its life cycle. */
export type GlobalFraudCheckPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global fraud check preference. Its code is unique within a tenant. */
export class GlobalFraudCheckPreference {
  code: string;
  name: string;
  journeyId: string;
  openRate: number;
  segment: string;
  threshold: number;
  frequencyCap: number;
  utmSource: string;
  reviewer: string;
  phone: string;
  amount: number;
  status: GlobalFraudCheckPreferenceStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    openRate: number,
    segment: string,
    threshold: number,
    frequencyCap: number,
    utmSource: string,
    reviewer: string,
    phone: string,
    amount: number,
    status: GlobalFraudCheckPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.segment = segment;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.phone = phone;
    this.amount = amount;
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

  canMoveTo(next: GlobalFraudCheckPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalFraudCheckPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.openRate + this.threshold) * 100) / 100;
  }

  copy(): GlobalFraudCheckPreference {
    return new GlobalFraudCheckPreference(
      this.code,
      this.name,
      this.journeyId,
      this.openRate,
      this.segment,
      this.threshold,
      this.frequencyCap,
      this.utmSource,
      this.reviewer,
      this.phone,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global fraud check preference in status idle. */
export function newGlobalFraudCheckPreference(code: string, name: string): GlobalFraudCheckPreference {
  return new GlobalFraudCheckPreference(code, name, "", 0, "", 0, 0, "", "", "", 0, "idle");
}
