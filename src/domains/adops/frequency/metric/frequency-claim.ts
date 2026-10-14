import * as text from "../../../../kit/text.js";

/** Where a frequency claim is in its life cycle. */
export type FrequencyClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A frequency claim. Its code is unique within a tenant. */
export class FrequencyClaim {
  code: string;
  title: string;
  approved: boolean;
  batchSize: number;
  locale: string;
  budget: number;
  source: string;
  retries: number;
  visible: boolean;
  status: FrequencyClaimStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    batchSize: number,
    locale: string,
    budget: number,
    source: string,
    retries: number,
    visible: boolean,
    status: FrequencyClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.batchSize = batchSize;
    this.locale = locale;
    this.budget = budget;
    this.source = source;
    this.retries = retries;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FrequencyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.retries) * 100) / 100;
  }

  copy(): FrequencyClaim {
    return new FrequencyClaim(
      this.code,
      this.title,
      this.approved,
      this.batchSize,
      this.locale,
      this.budget,
      this.source,
      this.retries,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a frequency claim in status planned. */
export function newFrequencyClaim(code: string, title: string): FrequencyClaim {
  return new FrequencyClaim(code, title, false, 0, "", 0, "", 0, false, "planned");
}
