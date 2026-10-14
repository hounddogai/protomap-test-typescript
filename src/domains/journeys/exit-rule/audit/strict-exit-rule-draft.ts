import * as text from "../../../../kit/text.js";

/** Where a strict exit rule draft is in its life cycle. */
export type StrictExitRuleDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict exit rule draft. Its code is unique within a tenant. */
export class StrictExitRuleDraft {
  code: string;
  title: string;
  impressions: number;
  ceiling: number;
  rate: number;
  version: number;
  active: boolean;
  minimum: number;
  label: string;
  quantity: number;
  discount: number;
  status: StrictExitRuleDraftStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    ceiling: number,
    rate: number,
    version: number,
    active: boolean,
    minimum: number,
    label: string,
    quantity: number,
    discount: number,
    status: StrictExitRuleDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.rate = rate;
    this.version = version;
    this.active = active;
    this.minimum = minimum;
    this.label = label;
    this.quantity = quantity;
    this.discount = discount;
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

  canMoveTo(next: StrictExitRuleDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictExitRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.version + this.quantity) * 100) / 100;
  }

  copy(): StrictExitRuleDraft {
    return new StrictExitRuleDraft(
      this.code,
      this.title,
      this.impressions,
      this.ceiling,
      this.rate,
      this.version,
      this.active,
      this.minimum,
      this.label,
      this.quantity,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict exit rule draft in status requested. */
export function newStrictExitRuleDraft(code: string, title: string): StrictExitRuleDraft {
  return new StrictExitRuleDraft(code, title, 0, 0, 0, 0, false, 0, "", 0, 0, "requested");
}
