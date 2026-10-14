import * as text from "../../../../kit/text.js";

/** Where a adaptive window agreement is in its life cycle. */
export type AdaptiveWindowAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive window agreement as the window team keeps it. */
export class AdaptiveWindowAgreement {
  code: string;
  name: string;
  discount: number;
  category: string;
  active: boolean;
  frequencyCap: number;
  quantity: number;
  sequence: number;
  weight: number;
  summary: string;
  maximum: number;
  status: AdaptiveWindowAgreementStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    category: string,
    active: boolean,
    frequencyCap: number,
    quantity: number,
    sequence: number,
    weight: number,
    summary: string,
    maximum: number,
    status: AdaptiveWindowAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.category = category;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.sequence = sequence;
    this.weight = weight;
    this.summary = summary;
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

  canMoveTo(next: AdaptiveWindowAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveWindowAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive window agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.discount + this.quantity) * 100) / 100;
  }

  copy(): AdaptiveWindowAgreement {
    return new AdaptiveWindowAgreement(
      this.code,
      this.name,
      this.discount,
      this.category,
      this.active,
      this.frequencyCap,
      this.quantity,
      this.sequence,
      this.weight,
      this.summary,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive window agreement in status new. */
export function newAdaptiveWindowAgreement(code: string, name: string): AdaptiveWindowAgreement {
  return new AdaptiveWindowAgreement(code, name, 0, "", false, 0, 0, 0, 0, "", 0, "new");
}
