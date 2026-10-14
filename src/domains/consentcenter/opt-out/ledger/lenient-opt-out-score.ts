import * as text from "../../../../kit/text.js";

/** Where a lenient opt out score is in its life cycle. */
export type LenientOptOutScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient opt out score as the opt out team keeps it. */
export class LenientOptOutScore {
  code: string;
  label: string;
  attributes: Map<string, string>;
  limit: number;
  locale: string;
  status: LenientOptOutScoreStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    limit: number,
    locale: string,
    status: LenientOptOutScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.limit = limit;
    this.locale = locale;
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

  canMoveTo(next: LenientOptOutScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientOptOutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient opt out score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): LenientOptOutScore {
    return new LenientOptOutScore(this.code, this.label, this.attributes, this.limit, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient opt out score in status new. */
export function newLenientOptOutScore(code: string, label: string): LenientOptOutScore {
  return new LenientOptOutScore(code, label, new Map<string, string>(), 0, "", "new");
}
