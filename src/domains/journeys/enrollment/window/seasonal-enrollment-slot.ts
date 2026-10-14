import * as text from "../../../../kit/text.js";

/** Where a seasonal enrollment slot is in its life cycle. */
export type SeasonalEnrollmentSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** One seasonal enrollment slot, with what the planners need to act on it. */
export class SeasonalEnrollmentSlot {
  code: string;
  label: string;
  audienceId: string;
  margin: number;
  updatedAt: number;
  ceiling: number;
  quantity: number;
  externalRef: string;
  description: string;
  status: SeasonalEnrollmentSlotStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    margin: number,
    updatedAt: number,
    ceiling: number,
    quantity: number,
    externalRef: string,
    description: string,
    status: SeasonalEnrollmentSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.margin = margin;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.externalRef = externalRef;
    this.description = description;
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

  canMoveTo(next: SeasonalEnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalEnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal enrollment slot"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.margin * this.ceiling * 100) / 100;
  }

  copy(): SeasonalEnrollmentSlot {
    return new SeasonalEnrollmentSlot(
      this.code,
      this.label,
      this.audienceId,
      this.margin,
      this.updatedAt,
      this.ceiling,
      this.quantity,
      this.externalRef,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal enrollment slot in status requested. */
export function newSeasonalEnrollmentSlot(code: string, label: string): SeasonalEnrollmentSlot {
  return new SeasonalEnrollmentSlot(code, label, "", 0, 0, 0, 0, "", "", "requested");
}
