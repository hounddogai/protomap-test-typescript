import * as text from "../../../../kit/text.js";

/** Where a lenient reputation score is in its life cycle. */
export type LenientReputationScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient reputation score as the reputation team keeps it. */
export class LenientReputationScore {
  code: string;
  title: string;
  endsAt: number;
  audienceId: string;
  source: string;
  status: LenientReputationScoreStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    audienceId: string,
    source: string,
    status: LenientReputationScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.source = source;
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

  canMoveTo(next: LenientReputationScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientReputationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reputation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): LenientReputationScore {
    return new LenientReputationScore(this.code, this.title, this.endsAt, this.audienceId, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient reputation score in status proposed. */
export function newLenientReputationScore(code: string, title: string): LenientReputationScore {
  return new LenientReputationScore(code, title, 0, "", "", "proposed");
}
