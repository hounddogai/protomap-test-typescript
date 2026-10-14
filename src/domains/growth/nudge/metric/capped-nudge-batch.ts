import * as text from "../../../../kit/text.js";

/** Where a capped nudge batch is in its life cycle. */
export type CappedNudgeBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped nudge batch and its current status. */
export class CappedNudgeBatch {
  code: string;
  label: string;
  active: boolean;
  segment: string;
  conversionRate: number;
  summary: string;
  rate: number;
  sequence: number;
  attributes: Map<string, string>;
  status: CappedNudgeBatchStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    segment: string,
    conversionRate: number,
    summary: string,
    rate: number,
    sequence: number,
    attributes: Map<string, string>,
    status: CappedNudgeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.summary = summary;
    this.rate = rate;
    this.sequence = sequence;
    this.attributes = attributes;
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

  canMoveTo(next: CappedNudgeBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedNudgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped nudge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped nudge batch"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.sequence - this.rate) * 100) / 100;
  }

  copy(): CappedNudgeBatch {
    return new CappedNudgeBatch(
      this.code,
      this.label,
      this.active,
      this.segment,
      this.conversionRate,
      this.summary,
      this.rate,
      this.sequence,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped nudge batch in status planned. */
export function newCappedNudgeBatch(code: string, label: string): CappedNudgeBatch {
  return new CappedNudgeBatch(code, label, false, "", 0, "", 0, 0, new Map<string, string>(), "planned");
}
