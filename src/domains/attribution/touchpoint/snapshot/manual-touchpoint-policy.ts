import * as text from "../../../../kit/text.js";

/** Where a manual touchpoint policy is in its life cycle. */
export type ManualTouchpointPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual touchpoint policy, with what the planners need to act on it. */
export class ManualTouchpointPolicy {
  code: string;
  name: string;
  startsAt: number;
  segment: string;
  endsAt: number;
  status: ManualTouchpointPolicyStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    segment: string,
    endsAt: number,
    status: ManualTouchpointPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.segment = segment;
    this.endsAt = endsAt;
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

  canMoveTo(next: ManualTouchpointPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTouchpointPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual touchpoint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt + this.endsAt) * 100) / 100;
  }

  copy(): ManualTouchpointPolicy {
    return new ManualTouchpointPolicy(this.code, this.name, this.startsAt, this.segment, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual touchpoint policy in status open. */
export function newManualTouchpointPolicy(code: string, name: string): ManualTouchpointPolicy {
  return new ManualTouchpointPolicy(code, name, 0, "", 0, "open");
}
