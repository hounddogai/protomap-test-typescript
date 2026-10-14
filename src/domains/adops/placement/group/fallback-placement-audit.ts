import * as text from "../../../../kit/text.js";

/** Where a fallback placement audit is in its life cycle. */
export type FallbackPlacementAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fallback placement audit, with what the planners need to act on it. */
export class FallbackPlacementAudit {
  code: string;
  label: string;
  journeyId: string;
  score: number;
  attempts: number;
  status: FallbackPlacementAuditStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    score: number,
    attempts: number,
    status: FallbackPlacementAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.score = score;
    this.attempts = attempts;
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

  canMoveTo(next: FallbackPlacementAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPlacementAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback placement audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback placement audit"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.attempts) * 100) / 100;
  }

  copy(): FallbackPlacementAudit {
    return new FallbackPlacementAudit(this.code, this.label, this.journeyId, this.score, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback placement audit in status proposed. */
export function newFallbackPlacementAudit(code: string, label: string): FallbackPlacementAudit {
  return new FallbackPlacementAudit(code, label, "", 0, 0, "proposed");
}
