import * as text from "../../../../kit/text.js";

/** Where a seasonal bounce preference is in its life cycle. */
export type SeasonalBouncePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal bounce preference as the bounce team keeps it. */
export class SeasonalBouncePreference {
  code: string;
  name: string;
  threshold: number;
  variant: string;
  amount: number;
  contactEmail: string;
  limit: number;
  cohort: string;
  source: string;
  reviewer: string;
  tags: string[];
  status: SeasonalBouncePreferenceStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    variant: string,
    amount: number,
    contactEmail: string,
    limit: number,
    cohort: string,
    source: string,
    reviewer: string,
    tags: string[],
    status: SeasonalBouncePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.variant = variant;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.cohort = cohort;
    this.source = source;
    this.reviewer = reviewer;
    this.tags = tags;
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

  canMoveTo(next: SeasonalBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
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

  moveTo(next: SeasonalBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.amount * this.threshold * 100) / 100;
  }

  copy(): SeasonalBouncePreference {
    return new SeasonalBouncePreference(
      this.code,
      this.name,
      this.threshold,
      this.variant,
      this.amount,
      this.contactEmail,
      this.limit,
      this.cohort,
      this.source,
      this.reviewer,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal bounce preference in status proposed. */
export function newSeasonalBouncePreference(code: string, name: string): SeasonalBouncePreference {
  return new SeasonalBouncePreference(code, name, 0, "", 0, "", 0, "", "", "", [], "proposed");
}
