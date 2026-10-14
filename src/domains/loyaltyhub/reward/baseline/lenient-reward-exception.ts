import * as text from "../../../../kit/text.js";

/** Where a lenient reward exception is in its life cycle. */
export type LenientRewardExceptionStatus = "created" | "validated" | "published" | "retired";

/** One lenient reward exception, with what the planners need to act on it. */
export class LenientRewardException {
  code: string;
  label: string;
  reviewer: string;
  timezone: string;
  sendAt: number;
  revision: number;
  status: LenientRewardExceptionStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    timezone: string,
    sendAt: number,
    revision: number,
    status: LenientRewardExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.revision = revision;
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

  canMoveTo(next: LenientRewardExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientRewardExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.sendAt * this.revision * 100) / 100;
  }

  copy(): LenientRewardException {
    return new LenientRewardException(
      this.code,
      this.label,
      this.reviewer,
      this.timezone,
      this.sendAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient reward exception in status created. */
export function newLenientRewardException(code: string, label: string): LenientRewardException {
  return new LenientRewardException(code, label, "", "", 0, 0, "created");
}
