import * as text from "../../../../kit/text.js";

/** Where a global pacing audit is in its life cycle. */
export type GlobalPacingAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global pacing audit. Its code is unique within a tenant. */
export class GlobalPacingAudit {
  code: string;
  name: string;
  channel: string;
  budget: number;
  locale: string;
  status: GlobalPacingAuditStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    budget: number,
    locale: string,
    status: GlobalPacingAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.budget = budget;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalPacingAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: GlobalPacingAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global pacing audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global pacing audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): GlobalPacingAudit {
    return new GlobalPacingAudit(this.code, this.name, this.channel, this.budget, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global pacing audit in status new. */
export function newGlobalPacingAudit(code: string, name: string): GlobalPacingAudit {
  return new GlobalPacingAudit(code, name, "", 0, "", "new");
}
