import * as text from "../../../../kit/text.js";

/** Where a rolling journey policy is in its life cycle. */
export type RollingJourneyPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling journey policy as the journey team keeps it. */
export class RollingJourneyPolicy {
  code: string;
  label: string;
  limit: number;
  channel: string;
  utmSource: string;
  country: string;
  segment: string;
  status: RollingJourneyPolicyStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    channel: string,
    utmSource: string,
    country: string,
    segment: string,
    status: RollingJourneyPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.channel = channel;
    this.utmSource = utmSource;
    this.country = country;
    this.segment = segment;
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

  canMoveTo(next: RollingJourneyPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: RollingJourneyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): RollingJourneyPolicy {
    return new RollingJourneyPolicy(
      this.code,
      this.label,
      this.limit,
      this.channel,
      this.utmSource,
      this.country,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling journey policy in status proposed. */
export function newRollingJourneyPolicy(code: string, label: string): RollingJourneyPolicy {
  return new RollingJourneyPolicy(code, label, 0, "", "", "", "", "proposed");
}
