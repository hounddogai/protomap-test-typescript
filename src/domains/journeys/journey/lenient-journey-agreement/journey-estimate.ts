import * as text from "../../../../kit/text.js";

/** Where a journey estimate is in its life cycle. */
export type JourneyEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey estimate as the journey team keeps it. */
export class JourneyEstimate {
  code: string;
  label: string;
  ownerId: string;
  utmSource: string;
  variant: string;
  ceiling: number;
  status: JourneyEstimateStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    utmSource: string,
    variant: string,
    ceiling: number,
    status: JourneyEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.variant = variant;
    this.ceiling = ceiling;
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

  canMoveTo(next: JourneyEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: JourneyEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey estimate"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): JourneyEstimate {
    return new JourneyEstimate(
      this.code,
      this.label,
      this.ownerId,
      this.utmSource,
      this.variant,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a journey estimate in status proposed. */
export function newJourneyEstimate(code: string, label: string): JourneyEstimate {
  return new JourneyEstimate(code, label, "", "", "", 0, "proposed");
}
