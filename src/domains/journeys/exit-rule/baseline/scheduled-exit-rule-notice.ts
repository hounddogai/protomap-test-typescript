import * as text from "../../../../kit/text.js";

/** Where a scheduled exit rule notice is in its life cycle. */
export type ScheduledExitRuleNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled exit rule notice as the exit rule team keeps it. */
export class ScheduledExitRuleNotice {
  code: string;
  label: string;
  name: string;
  createdAt: number;
  audienceId: string;
  status: ScheduledExitRuleNoticeStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    createdAt: number,
    audienceId: string,
    status: ScheduledExitRuleNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.createdAt = createdAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: ScheduledExitRuleNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
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

  moveTo(next: ScheduledExitRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled exit rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled exit rule notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ScheduledExitRuleNotice {
    return new ScheduledExitRuleNotice(this.code, this.label, this.name, this.createdAt, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled exit rule notice in status proposed. */
export function newScheduledExitRuleNotice(code: string, label: string): ScheduledExitRuleNotice {
  return new ScheduledExitRuleNotice(code, label, "", 0, "", "proposed");
}
