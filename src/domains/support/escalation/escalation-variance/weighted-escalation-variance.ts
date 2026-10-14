/**
 * The weighted escalation variance records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted escalation variance is in its life cycle. */
export type WeightedEscalationVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted escalation variance. Its code is unique within a tenant. */
export class WeightedEscalationVariance {
  code: string;
  label: string;
  cohort: string;
  source: string;
  ceiling: number;
  attributes: Map<string, string>;
  status: WeightedEscalationVarianceStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    source: string,
    ceiling: number,
    attributes: Map<string, string>,
    status: WeightedEscalationVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.source = source;
    this.ceiling = ceiling;
    this.attributes = attributes;
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

  canMoveTo(next: WeightedEscalationVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedEscalationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted escalation variance"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): WeightedEscalationVariance {
    return new WeightedEscalationVariance(
      this.code,
      this.label,
      this.cohort,
      this.source,
      this.ceiling,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted escalation variance in status new. */
export function newWeightedEscalationVariance(code: string, label: string): WeightedEscalationVariance {
  return new WeightedEscalationVariance(code, label, "", "", 0, new Map<string, string>(), "new");
}
