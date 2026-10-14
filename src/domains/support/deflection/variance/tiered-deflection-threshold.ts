import * as text from "../../../../kit/text.js";

/** Where a tiered deflection threshold is in its life cycle. */
export type TieredDeflectionThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered deflection threshold. Its code is unique within a tenant. */
export class TieredDeflectionThreshold {
  code: string;
  label: string;
  quantity: number;
  approved: boolean;
  locale: string;
  externalRef: string;
  journeyId: string;
  active: boolean;
  score: number;
  endsAt: number;
  status: TieredDeflectionThresholdStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    approved: boolean,
    locale: string,
    externalRef: string,
    journeyId: string,
    active: boolean,
    score: number,
    endsAt: number,
    status: TieredDeflectionThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.approved = approved;
    this.locale = locale;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.active = active;
    this.score = score;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredDeflectionThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredDeflectionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered deflection threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered deflection threshold"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.quantity * this.score * 100) / 100;
  }

  copy(): TieredDeflectionThreshold {
    return new TieredDeflectionThreshold(
      this.code,
      this.label,
      this.quantity,
      this.approved,
      this.locale,
      this.externalRef,
      this.journeyId,
      this.active,
      this.score,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered deflection threshold in status open. */
export function newTieredDeflectionThreshold(code: string, label: string): TieredDeflectionThreshold {
  return new TieredDeflectionThreshold(code, label, 0, false, "", "", "", false, 0, 0, "open");
}
