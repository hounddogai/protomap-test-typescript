import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule bundle is in its life cycle. */
export type AdaptiveExitRuleBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive exit rule bundle as the exit rule team keeps it. */
export class AdaptiveExitRuleBundle {
  code: string;
  name: string;
  contactEmail: string;
  weight: number;
  sequence: number;
  phone: string;
  attempts: number;
  status: AdaptiveExitRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    weight: number,
    sequence: number,
    phone: string,
    attempts: number,
    status: AdaptiveExitRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.sequence = sequence;
    this.phone = phone;
    this.attempts = attempts;
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

  canMoveTo(next: AdaptiveExitRuleBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveExitRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.weight * this.sequence * 100) / 100;
  }

  copy(): AdaptiveExitRuleBundle {
    return new AdaptiveExitRuleBundle(
      this.code,
      this.name,
      this.contactEmail,
      this.weight,
      this.sequence,
      this.phone,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive exit rule bundle in status planned. */
export function newAdaptiveExitRuleBundle(code: string, name: string): AdaptiveExitRuleBundle {
  return new AdaptiveExitRuleBundle(code, name, "", 0, 0, "", 0, "planned");
}
