import * as text from "../../../../kit/text.js";

/** Where a lenient nudge estimate is in its life cycle. */
export type LenientNudgeEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient nudge estimate as the nudge team keeps it. */
export class LenientNudgeEstimate {
  code: string;
  name: string;
  utmSource: string;
  revision: number;
  pinned: boolean;
  status: LenientNudgeEstimateStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    revision: number,
    pinned: boolean,
    status: LenientNudgeEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.revision = revision;
    this.pinned = pinned;
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

  canMoveTo(next: LenientNudgeEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done" || next === "failed";
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

  moveTo(next: LenientNudgeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient nudge estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"lenient nudge estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): LenientNudgeEstimate {
    return new LenientNudgeEstimate(this.code, this.name, this.utmSource, this.revision, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient nudge estimate in status new. */
export function newLenientNudgeEstimate(code: string, name: string): LenientNudgeEstimate {
  return new LenientNudgeEstimate(code, name, "", 0, false, "new");
}
