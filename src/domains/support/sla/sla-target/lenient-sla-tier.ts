import * as text from "../../../../kit/text.js";

/** Where a lenient sla tier is in its life cycle. */
export type LenientSlaTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient sla tier. Its code is unique within a tenant. */
export class LenientSlaTier {
  code: string;
  label: string;
  graceDays: number;
  description: string;
  amount: number;
  ceiling: number;
  revision: number;
  locale: string;
  score: number;
  margin: number;
  status: LenientSlaTierStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    description: string,
    amount: number,
    ceiling: number,
    revision: number,
    locale: string,
    score: number,
    margin: number,
    status: LenientSlaTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.description = description;
    this.amount = amount;
    this.ceiling = ceiling;
    this.revision = revision;
    this.locale = locale;
    this.score = score;
    this.margin = margin;
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

  canMoveTo(next: LenientSlaTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
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

  moveTo(next: LenientSlaTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient sla tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.margin + this.revision) * 100) / 100;
  }

  copy(): LenientSlaTier {
    return new LenientSlaTier(
      this.code,
      this.label,
      this.graceDays,
      this.description,
      this.amount,
      this.ceiling,
      this.revision,
      this.locale,
      this.score,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient sla tier in status new. */
export function newLenientSlaTier(code: string, label: string): LenientSlaTier {
  return new LenientSlaTier(code, label, 0, "", 0, 0, 0, "", 0, 0, "new");
}
