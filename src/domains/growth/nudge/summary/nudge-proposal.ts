import * as text from "../../../../kit/text.js";

/** Where a nudge proposal is in its life cycle. */
export type NudgeProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A nudge proposal. Its code is unique within a tenant. */
export class NudgeProposal {
  code: string;
  title: string;
  timezone: string;
  locale: string;
  priority: number;
  status: NudgeProposalStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    locale: string,
    priority: number,
    status: NudgeProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.locale = locale;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: NudgeProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): NudgeProposal {
    return new NudgeProposal(this.code, this.title, this.timezone, this.locale, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge proposal in status idle. */
export function newNudgeProposal(code: string, title: string): NudgeProposal {
  return new NudgeProposal(code, title, "", "", 0, "idle");
}
