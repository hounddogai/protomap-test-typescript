import * as text from "../../../../kit/text.js";

/** Where a fallback macro slot is in its life cycle. */
export type FallbackMacroSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback macro slot, with what the planners need to act on it. */
export class FallbackMacroSlot {
  code: string;
  label: string;
  revision: number;
  score: number;
  locale: string;
  threshold: number;
  conversionRate: number;
  budget: number;
  status: FallbackMacroSlotStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    score: number,
    locale: string,
    threshold: number,
    conversionRate: number,
    budget: number,
    status: FallbackMacroSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.score = score;
    this.locale = locale;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.budget = budget;
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

  canMoveTo(next: FallbackMacroSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: FallbackMacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"fallback macro slot"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.threshold * this.revision * 100) / 100;
  }

  copy(): FallbackMacroSlot {
    return new FallbackMacroSlot(
      this.code,
      this.label,
      this.revision,
      this.score,
      this.locale,
      this.threshold,
      this.conversionRate,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback macro slot in status open. */
export function newFallbackMacroSlot(code: string, label: string): FallbackMacroSlot {
  return new FallbackMacroSlot(code, label, 0, 0, "", 0, 0, 0, "open");
}
