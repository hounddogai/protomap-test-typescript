import * as text from "../../../../kit/text.js";

/** Where a mention baseline is in its life cycle. */
export type MentionBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One mention baseline, with what the planners need to act on it. */
export class MentionBaseline {
  code: string;
  name: string;
  conversionRate: number;
  ratio: number;
  rate: number;
  status: MentionBaselineStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    ratio: number,
    rate: number,
    status: MentionBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
    this.rate = rate;
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

  canMoveTo(next: MentionBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: MentionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"mention baseline"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.conversionRate + this.ratio) * 100) / 100;
  }

  copy(): MentionBaseline {
    return new MentionBaseline(this.code, this.name, this.conversionRate, this.ratio, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention baseline in status new. */
export function newMentionBaseline(code: string, name: string): MentionBaseline {
  return new MentionBaseline(code, name, 0, 0, 0, "new");
}
