import * as text from "../../../../kit/text.js";

/** Where a frequency policy is in its life cycle. */
export type FrequencyPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One frequency policy, with what the planners need to act on it. */
export class FrequencyPolicy {
  code: string;
  title: string;
  windowDays: number;
  checksum: string;
  startsAt: number;
  limit: number;
  status: FrequencyPolicyStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    checksum: string,
    startsAt: number,
    limit: number,
    status: FrequencyPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.limit = limit;
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

  canMoveTo(next: FrequencyPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FrequencyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"frequency policy"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.windowDays * this.startsAt * 100) / 100;
  }

  copy(): FrequencyPolicy {
    return new FrequencyPolicy(
      this.code,
      this.title,
      this.windowDays,
      this.checksum,
      this.startsAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a frequency policy in status open. */
export function newFrequencyPolicy(code: string, title: string): FrequencyPolicy {
  return new FrequencyPolicy(code, title, 0, "", 0, 0, "open");
}
