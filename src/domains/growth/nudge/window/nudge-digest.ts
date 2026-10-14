import * as text from "../../../../kit/text.js";

/** Where a nudge digest is in its life cycle. */
export type NudgeDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One nudge digest, with what the planners need to act on it. */
export class NudgeDigest {
  code: string;
  title: string;
  amount: number;
  description: string;
  rate: number;
  unit: string;
  retries: number;
  openRate: number;
  status: NudgeDigestStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    description: string,
    rate: number,
    unit: string,
    retries: number,
    openRate: number,
    status: NudgeDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.description = description;
    this.rate = rate;
    this.unit = unit;
    this.retries = retries;
    this.openRate = openRate;
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

  canMoveTo(next: NudgeDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: NudgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.rate + this.retries) * 100) / 100;
  }

  copy(): NudgeDigest {
    return new NudgeDigest(
      this.code,
      this.title,
      this.amount,
      this.description,
      this.rate,
      this.unit,
      this.retries,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a nudge digest in status new. */
export function newNudgeDigest(code: string, title: string): NudgeDigest {
  return new NudgeDigest(code, title, 0, "", 0, "", 0, 0, "new");
}
