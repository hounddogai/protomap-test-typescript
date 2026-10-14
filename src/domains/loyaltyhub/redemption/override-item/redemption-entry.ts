import * as text from "../../../../kit/text.js";

/** Where a redemption entry is in its life cycle. */
export type RedemptionEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A redemption entry. Its code is unique within a tenant. */
export class RedemptionEntry {
  code: string;
  title: string;
  ratio: number;
  archived: boolean;
  ownerId: string;
  timezone: string;
  impressions: number;
  cohort: string;
  locale: string;
  status: RedemptionEntryStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    archived: boolean,
    ownerId: string,
    timezone: string,
    impressions: number,
    cohort: string,
    locale: string,
    status: RedemptionEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.archived = archived;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.impressions = impressions;
    this.cohort = cohort;
    this.locale = locale;
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

  canMoveTo(next: RedemptionEntryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.impressions + this.ratio) * 100) / 100;
  }

  copy(): RedemptionEntry {
    return new RedemptionEntry(
      this.code,
      this.title,
      this.ratio,
      this.archived,
      this.ownerId,
      this.timezone,
      this.impressions,
      this.cohort,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a redemption entry in status new. */
export function newRedemptionEntry(code: string, title: string): RedemptionEntry {
  return new RedemptionEntry(code, title, 0, false, "", "", 0, "", "", "new");
}
