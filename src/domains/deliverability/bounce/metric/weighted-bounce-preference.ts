import * as text from "../../../../kit/text.js";

/** Where a weighted bounce preference is in its life cycle. */
export type WeightedBouncePreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted bounce preference as the bounce team keeps it. */
export class WeightedBouncePreference {
  code: string;
  name: string;
  category: string;
  locale: string;
  discount: number;
  channel: string;
  retries: number;
  ratio: number;
  status: WeightedBouncePreferenceStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    locale: string,
    discount: number,
    channel: string,
    retries: number,
    ratio: number,
    status: WeightedBouncePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.locale = locale;
    this.discount = discount;
    this.channel = channel;
    this.retries = retries;
    this.ratio = ratio;
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

  canMoveTo(next: WeightedBouncePreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: WeightedBouncePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted bounce preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted bounce preference"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.retries * this.ratio * 100) / 100;
  }

  copy(): WeightedBouncePreference {
    return new WeightedBouncePreference(
      this.code,
      this.name,
      this.category,
      this.locale,
      this.discount,
      this.channel,
      this.retries,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted bounce preference in status proposed. */
export function newWeightedBouncePreference(code: string, name: string): WeightedBouncePreference {
  return new WeightedBouncePreference(code, name, "", "", 0, "", 0, 0, "proposed");
}
