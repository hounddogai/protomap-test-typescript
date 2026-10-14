import * as text from "../../../../kit/text.js";

/** Where a primary nudge digest is in its life cycle. */
export type PrimaryNudgeDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary nudge digest. Its code is unique within a tenant. */
export class PrimaryNudgeDigest {
  code: string;
  title: string;
  graceDays: number;
  endsAt: number;
  durationMinutes: number;
  limit: number;
  status: PrimaryNudgeDigestStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    endsAt: number,
    durationMinutes: number,
    limit: number,
    status: PrimaryNudgeDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.endsAt = endsAt;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryNudgeDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryNudgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary nudge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.graceDays - this.limit) * 100) / 100;
  }

  copy(): PrimaryNudgeDigest {
    return new PrimaryNudgeDigest(
      this.code,
      this.title,
      this.graceDays,
      this.endsAt,
      this.durationMinutes,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary nudge digest in status proposed. */
export function newPrimaryNudgeDigest(code: string, title: string): PrimaryNudgeDigest {
  return new PrimaryNudgeDigest(code, title, 0, 0, 0, 0, "proposed");
}
