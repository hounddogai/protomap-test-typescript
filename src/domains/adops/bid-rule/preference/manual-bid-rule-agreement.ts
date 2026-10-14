import * as text from "../../../../kit/text.js";

/** Where a manual bid rule agreement is in its life cycle. */
export type ManualBidRuleAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One manual bid rule agreement, with what the planners need to act on it. */
export class ManualBidRuleAgreement {
  code: string;
  name: string;
  revision: number;
  country: string;
  minimum: number;
  budget: number;
  maximum: number;
  active: boolean;
  floorValue: number;
  weight: number;
  visible: boolean;
  status: ManualBidRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    country: string,
    minimum: number,
    budget: number,
    maximum: number,
    active: boolean,
    floorValue: number,
    weight: number,
    visible: boolean,
    status: ManualBidRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.country = country;
    this.minimum = minimum;
    this.budget = budget;
    this.maximum = maximum;
    this.active = active;
    this.floorValue = floorValue;
    this.weight = weight;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualBidRuleAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualBidRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"manual bid rule agreement"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.weight + this.budget) * 100) / 100;
  }

  copy(): ManualBidRuleAgreement {
    return new ManualBidRuleAgreement(
      this.code,
      this.name,
      this.revision,
      this.country,
      this.minimum,
      this.budget,
      this.maximum,
      this.active,
      this.floorValue,
      this.weight,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual bid rule agreement in status planned. */
export function newManualBidRuleAgreement(code: string, name: string): ManualBidRuleAgreement {
  return new ManualBidRuleAgreement(code, name, 0, "", 0, 0, 0, false, 0, 0, false, "planned");
}
