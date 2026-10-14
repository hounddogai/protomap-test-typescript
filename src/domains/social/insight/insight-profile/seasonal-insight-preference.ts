import * as text from "../../../../kit/text.js";

/** Where a seasonal insight preference is in its life cycle. */
export type SeasonalInsightPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One seasonal insight preference, with what the planners need to act on it. */
export class SeasonalInsightPreference {
  code: string;
  label: string;
  frequencyCap: number;
  category: string;
  locale: string;
  currency: string;
  version: number;
  amount: number;
  pinned: boolean;
  maximum: number;
  status: SeasonalInsightPreferenceStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    category: string,
    locale: string,
    currency: string,
    version: number,
    amount: number,
    pinned: boolean,
    maximum: number,
    status: SeasonalInsightPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.locale = locale;
    this.currency = currency;
    this.version = version;
    this.amount = amount;
    this.pinned = pinned;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalInsightPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalInsightPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.frequencyCap * this.version * 100) / 100;
  }

  copy(): SeasonalInsightPreference {
    return new SeasonalInsightPreference(
      this.code,
      this.label,
      this.frequencyCap,
      this.category,
      this.locale,
      this.currency,
      this.version,
      this.amount,
      this.pinned,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal insight preference in status new. */
export function newSeasonalInsightPreference(code: string, label: string): SeasonalInsightPreference {
  return new SeasonalInsightPreference(code, label, 0, "", "", "", 0, 0, false, 0, "new");
}
