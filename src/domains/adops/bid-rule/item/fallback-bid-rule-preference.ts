import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule preference is in its life cycle. */
export type FallbackBidRulePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback bid rule preference. Its code is unique within a tenant. */
export class FallbackBidRulePreference {
  code: string;
  name: string;
  active: boolean;
  margin: number;
  segment: string;
  cohort: string;
  checksum: string;
  sequence: number;
  status: FallbackBidRulePreferenceStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    margin: number,
    segment: string,
    cohort: string,
    checksum: string,
    sequence: number,
    status: FallbackBidRulePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.margin = margin;
    this.segment = segment;
    this.cohort = cohort;
    this.checksum = checksum;
    this.sequence = sequence;
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

  canMoveTo(next: FallbackBidRulePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBidRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.sequence) * 100) / 100;
  }

  copy(): FallbackBidRulePreference {
    return new FallbackBidRulePreference(
      this.code,
      this.name,
      this.active,
      this.margin,
      this.segment,
      this.cohort,
      this.checksum,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback bid rule preference in status proposed. */
export function newFallbackBidRulePreference(code: string, name: string): FallbackBidRulePreference {
  return new FallbackBidRulePreference(code, name, false, 0, "", "", "", 0, "proposed");
}
