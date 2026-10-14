import * as text from "../../../../kit/text.js";

/** Where a seasonal reward entry is in its life cycle. */
export type SeasonalRewardEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a seasonal reward entry and its current status. */
export class SeasonalRewardEntry {
  code: string;
  title: string;
  visible: boolean;
  unit: string;
  audienceId: string;
  phone: string;
  quantity: number;
  status: SeasonalRewardEntryStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    unit: string,
    audienceId: string,
    phone: string,
    quantity: number,
    status: SeasonalRewardEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.unit = unit;
    this.audienceId = audienceId;
    this.phone = phone;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalRewardEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalRewardEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal reward entry"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): SeasonalRewardEntry {
    return new SeasonalRewardEntry(
      this.code,
      this.title,
      this.visible,
      this.unit,
      this.audienceId,
      this.phone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a seasonal reward entry in status requested. */
export function newSeasonalRewardEntry(code: string, title: string): SeasonalRewardEntry {
  return new SeasonalRewardEntry(code, title, false, "", "", "", 0, "requested");
}
