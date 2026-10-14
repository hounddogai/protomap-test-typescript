import * as text from "../../../../kit/text.js";

/** Where a regional reward rule exception is in its life cycle. */
export type RegionalRewardRuleExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional reward rule exception. Its code is unique within a tenant. */
export class RegionalRewardRuleException {
  code: string;
  label: string;
  contactEmail: string;
  utmSource: string;
  active: boolean;
  channel: string;
  score: number;
  status: RegionalRewardRuleExceptionStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    utmSource: string,
    active: boolean,
    channel: string,
    score: number,
    status: RegionalRewardRuleExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.active = active;
    this.channel = channel;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalRewardRuleExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalRewardRuleExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reward rule exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional reward rule exception"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RegionalRewardRuleException {
    return new RegionalRewardRuleException(
      this.code,
      this.label,
      this.contactEmail,
      this.utmSource,
      this.active,
      this.channel,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional reward rule exception in status planned. */
export function newRegionalRewardRuleException(code: string, label: string): RegionalRewardRuleException {
  return new RegionalRewardRuleException(code, label, "", "", false, "", 0, "planned");
}
