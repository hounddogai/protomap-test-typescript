import * as text from "../../../../kit/text.js";

/** Where a credit mapping is in its life cycle. */
export type CreditMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One credit mapping, with what the planners need to act on it. */
export class CreditMapping {
  code: string;
  name: string;
  campaignRef: string;
  journeyId: string;
  durationMinutes: number;
  impressions: number;
  sequence: number;
  score: number;
  status: CreditMappingStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    journeyId: string,
    durationMinutes: number,
    impressions: number,
    sequence: number,
    score: number,
    status: CreditMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.sequence = sequence;
    this.score = score;
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

  canMoveTo(next: CreditMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit mapping"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.score * this.impressions * 100) / 100;
  }

  copy(): CreditMapping {
    return new CreditMapping(
      this.code,
      this.name,
      this.campaignRef,
      this.journeyId,
      this.durationMinutes,
      this.impressions,
      this.sequence,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a credit mapping in status proposed. */
export function newCreditMapping(code: string, name: string): CreditMapping {
  return new CreditMapping(code, name, "", "", 0, 0, 0, 0, "proposed");
}
