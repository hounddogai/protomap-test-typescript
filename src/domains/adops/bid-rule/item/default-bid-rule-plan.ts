import * as text from "../../../../kit/text.js";

/** Where a default bid rule plan is in its life cycle. */
export type DefaultBidRulePlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default bid rule plan, with what the planners need to act on it. */
export class DefaultBidRulePlan {
  code: string;
  name: string;
  summary: string;
  ratio: number;
  expiresAt: number;
  startsAt: number;
  durationMinutes: number;
  floorValue: number;
  attempts: number;
  checksum: string;
  status: DefaultBidRulePlanStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    ratio: number,
    expiresAt: number,
    startsAt: number,
    durationMinutes: number,
    floorValue: number,
    attempts: number,
    checksum: string,
    status: DefaultBidRulePlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.attempts = attempts;
    this.checksum = checksum;
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

  canMoveTo(next: DefaultBidRulePlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBidRulePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default bid rule plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.startsAt + this.attempts) * 100) / 100;
  }

  copy(): DefaultBidRulePlan {
    return new DefaultBidRulePlan(
      this.code,
      this.name,
      this.summary,
      this.ratio,
      this.expiresAt,
      this.startsAt,
      this.durationMinutes,
      this.floorValue,
      this.attempts,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default bid rule plan in status open. */
export function newDefaultBidRulePlan(code: string, name: string): DefaultBidRulePlan {
  return new DefaultBidRulePlan(code, name, "", 0, 0, 0, 0, 0, 0, "", "open");
}
