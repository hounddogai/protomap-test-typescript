import * as text from "../../../../kit/text.js";

/** Where a default frequency score is in its life cycle. */
export type DefaultFrequencyScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default frequency score as the frequency team keeps it. */
export class DefaultFrequencyScore {
  code: string;
  name: string;
  phone: string;
  threshold: number;
  frequencyCap: number;
  amount: number;
  description: string;
  status: DefaultFrequencyScoreStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    threshold: number,
    frequencyCap: number,
    amount: number,
    description: string,
    status: DefaultFrequencyScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
    this.description = description;
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

  canMoveTo(next: DefaultFrequencyScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultFrequencyScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.amount - this.threshold) * 100) / 100;
  }

  copy(): DefaultFrequencyScore {
    return new DefaultFrequencyScore(
      this.code,
      this.name,
      this.phone,
      this.threshold,
      this.frequencyCap,
      this.amount,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default frequency score in status open. */
export function newDefaultFrequencyScore(code: string, name: string): DefaultFrequencyScore {
  return new DefaultFrequencyScore(code, name, "", 0, 0, 0, "", "open");
}
