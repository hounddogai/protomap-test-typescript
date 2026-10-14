import * as text from "../../../../kit/text.js";

/** Where a manual streak tier is in its life cycle. */
export type ManualStreakTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual streak tier as the streak team keeps it. */
export class ManualStreakTier {
  code: string;
  name: string;
  locale: string;
  cost: number;
  cohort: string;
  margin: number;
  amount: number;
  country: string;
  channel: string;
  audienceId: string;
  visible: boolean;
  status: ManualStreakTierStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    cost: number,
    cohort: string,
    margin: number,
    amount: number,
    country: string,
    channel: string,
    audienceId: string,
    visible: boolean,
    status: ManualStreakTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.cost = cost;
    this.cohort = cohort;
    this.margin = margin;
    this.amount = amount;
    this.country = country;
    this.channel = channel;
    this.audienceId = audienceId;
    this.visible = visible;
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

  canMoveTo(next: ManualStreakTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualStreakTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual streak tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.cost + this.margin) * 100) / 100;
  }

  copy(): ManualStreakTier {
    return new ManualStreakTier(
      this.code,
      this.name,
      this.locale,
      this.cost,
      this.cohort,
      this.margin,
      this.amount,
      this.country,
      this.channel,
      this.audienceId,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual streak tier in status new. */
export function newManualStreakTier(code: string, name: string): ManualStreakTier {
  return new ManualStreakTier(code, name, "", 0, "", 0, 0, "", "", "", false, "new");
}
