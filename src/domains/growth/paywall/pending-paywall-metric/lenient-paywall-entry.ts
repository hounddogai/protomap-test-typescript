import * as text from "../../../../kit/text.js";

/** Where a lenient paywall entry is in its life cycle. */
export type LenientPaywallEntryStatus = "created" | "validated" | "published" | "retired";

/** One lenient paywall entry, with what the planners need to act on it. */
export class LenientPaywallEntry {
  code: string;
  title: string;
  maximum: number;
  threshold: number;
  summary: string;
  status: LenientPaywallEntryStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    threshold: number,
    summary: string,
    status: LenientPaywallEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.threshold = threshold;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPaywallEntryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientPaywallEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient paywall entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold + this.maximum) * 100) / 100;
  }

  copy(): LenientPaywallEntry {
    return new LenientPaywallEntry(this.code, this.title, this.maximum, this.threshold, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient paywall entry in status created. */
export function newLenientPaywallEntry(code: string, title: string): LenientPaywallEntry {
  return new LenientPaywallEntry(code, title, 0, 0, "", "created");
}
