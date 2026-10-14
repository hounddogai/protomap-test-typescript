import * as text from "../../../../kit/text.js";

/** Where a global fraud check slot is in its life cycle. */
export type GlobalFraudCheckSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a global fraud check slot and its current status. */
export class GlobalFraudCheckSlot {
  code: string;
  title: string;
  attributes: Map<string, string>;
  score: number;
  maximum: number;
  campaignRef: string;
  status: GlobalFraudCheckSlotStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    score: number,
    maximum: number,
    campaignRef: string,
    status: GlobalFraudCheckSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.score = score;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: GlobalFraudCheckSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalFraudCheckSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.score + this.maximum) * 100) / 100;
  }

  copy(): GlobalFraudCheckSlot {
    return new GlobalFraudCheckSlot(
      this.code,
      this.title,
      this.attributes,
      this.score,
      this.maximum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global fraud check slot in status proposed. */
export function newGlobalFraudCheckSlot(code: string, title: string): GlobalFraudCheckSlot {
  return new GlobalFraudCheckSlot(code, title, new Map<string, string>(), 0, 0, "", "proposed");
}
