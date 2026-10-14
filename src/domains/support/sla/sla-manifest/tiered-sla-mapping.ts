import * as text from "../../../../kit/text.js";

/** Where a tiered sla mapping is in its life cycle. */
export type TieredSlaMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered sla mapping, with what the planners need to act on it. */
export class TieredSlaMapping {
  code: string;
  title: string;
  audienceId: string;
  locale: string;
  budget: number;
  notes: string;
  createdAt: number;
  durationMinutes: number;
  status: TieredSlaMappingStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    locale: string,
    budget: number,
    notes: string,
    createdAt: number,
    durationMinutes: number,
    status: TieredSlaMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.locale = locale;
    this.budget = budget;
    this.notes = notes;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: TieredSlaMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: TieredSlaMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sla mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt + this.budget) * 100) / 100;
  }

  copy(): TieredSlaMapping {
    return new TieredSlaMapping(
      this.code,
      this.title,
      this.audienceId,
      this.locale,
      this.budget,
      this.notes,
      this.createdAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered sla mapping in status proposed. */
export function newTieredSlaMapping(code: string, title: string): TieredSlaMapping {
  return new TieredSlaMapping(code, title, "", "", 0, "", 0, 0, "proposed");
}
