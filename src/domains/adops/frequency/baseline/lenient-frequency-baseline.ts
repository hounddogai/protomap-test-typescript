import * as text from "../../../../kit/text.js";

/** Where a lenient frequency baseline is in its life cycle. */
export type LenientFrequencyBaselineStatus = "created" | "validated" | "published" | "retired";

/** A lenient frequency baseline as the frequency team keeps it. */
export class LenientFrequencyBaseline {
  code: string;
  title: string;
  margin: number;
  ratio: number;
  revision: number;
  locale: string;
  discount: number;
  status: LenientFrequencyBaselineStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    ratio: number,
    revision: number,
    locale: string,
    discount: number,
    status: LenientFrequencyBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.ratio = ratio;
    this.revision = revision;
    this.locale = locale;
    this.discount = discount;
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

  canMoveTo(next: LenientFrequencyBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFrequencyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient frequency baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.revision - this.margin) * 100) / 100;
  }

  copy(): LenientFrequencyBaseline {
    return new LenientFrequencyBaseline(
      this.code,
      this.title,
      this.margin,
      this.ratio,
      this.revision,
      this.locale,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient frequency baseline in status created. */
export function newLenientFrequencyBaseline(code: string, title: string): LenientFrequencyBaseline {
  return new LenientFrequencyBaseline(code, title, 0, 0, 0, "", 0, "created");
}
