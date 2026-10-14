import * as text from "../../../../kit/text.js";

/** Where a legacy flight policy is in its life cycle. */
export type LegacyFlightPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy flight policy, with what the planners need to act on it. */
export class LegacyFlightPolicy {
  code: string;
  title: string;
  segment: string;
  frequencyCap: number;
  externalRef: string;
  status: LegacyFlightPolicyStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    frequencyCap: number,
    externalRef: string,
    status: LegacyFlightPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFlightPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFlightPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy flight policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): LegacyFlightPolicy {
    return new LegacyFlightPolicy(
      this.code,
      this.title,
      this.segment,
      this.frequencyCap,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy flight policy in status requested. */
export function newLegacyFlightPolicy(code: string, title: string): LegacyFlightPolicy {
  return new LegacyFlightPolicy(code, title, "", 0, "", "requested");
}
