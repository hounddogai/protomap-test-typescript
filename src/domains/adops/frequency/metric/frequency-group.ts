import * as text from "../../../../kit/text.js";

/** Where a frequency group is in its life cycle. */
export type FrequencyGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A frequency group as the frequency team keeps it. */
export class FrequencyGroup {
  code: string;
  label: string;
  locale: string;
  minimum: number;
  priority: number;
  segment: string;
  budget: number;
  status: FrequencyGroupStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    minimum: number,
    priority: number,
    segment: string,
    budget: number,
    status: FrequencyGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.minimum = minimum;
    this.priority = priority;
    this.segment = segment;
    this.budget = budget;
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

  canMoveTo(next: FrequencyGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"frequency group"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.budget * this.priority * 100) / 100;
  }

  copy(): FrequencyGroup {
    return new FrequencyGroup(
      this.code,
      this.label,
      this.locale,
      this.minimum,
      this.priority,
      this.segment,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a frequency group in status new. */
export function newFrequencyGroup(code: string, label: string): FrequencyGroup {
  return new FrequencyGroup(code, label, "", 0, 0, "", 0, "new");
}
