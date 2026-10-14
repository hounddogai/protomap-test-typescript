import * as text from "../../../../kit/text.js";

/** Where a weighted escalation digest is in its life cycle. */
export type WeightedEscalationDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted escalation digest, with what the planners need to act on it. */
export class WeightedEscalationDigest {
  code: string;
  label: string;
  journeyId: string;
  budget: number;
  externalRef: string;
  attributes: Map<string, string>;
  active: boolean;
  status: WeightedEscalationDigestStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    budget: number,
    externalRef: string,
    attributes: Map<string, string>,
    active: boolean,
    status: WeightedEscalationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.budget = budget;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedEscalationDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedEscalationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): WeightedEscalationDigest {
    return new WeightedEscalationDigest(
      this.code,
      this.label,
      this.journeyId,
      this.budget,
      this.externalRef,
      this.attributes,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted escalation digest in status draft. */
export function newWeightedEscalationDigest(code: string, label: string): WeightedEscalationDigest {
  return new WeightedEscalationDigest(code, label, "", 0, "", new Map<string, string>(), false, "draft");
}
