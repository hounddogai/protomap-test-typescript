import * as text from "../../../../kit/text.js";

/** Where a fallback insight cycle is in its life cycle. */
export type FallbackInsightCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback insight cycle and its current status. */
export class FallbackInsightCycle {
  code: string;
  label: string;
  attributes: Map<string, string>;
  notes: string;
  active: boolean;
  campaignRef: string;
  variant: string;
  score: number;
  status: FallbackInsightCycleStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    notes: string,
    active: boolean,
    campaignRef: string,
    variant: string,
    score: number,
    status: FallbackInsightCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.notes = notes;
    this.active = active;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: FallbackInsightCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackInsightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FallbackInsightCycle {
    return new FallbackInsightCycle(
      this.code,
      this.label,
      this.attributes,
      this.notes,
      this.active,
      this.campaignRef,
      this.variant,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback insight cycle in status proposed. */
export function newFallbackInsightCycle(code: string, label: string): FallbackInsightCycle {
  return new FallbackInsightCycle(code, label, new Map<string, string>(), "", false, "", "", 0, "proposed");
}
