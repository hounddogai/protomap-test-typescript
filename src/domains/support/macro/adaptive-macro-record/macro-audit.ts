import * as text from "../../../../kit/text.js";

/** Where a macro audit is in its life cycle. */
export type MacroAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro audit as the macro team keeps it. */
export class MacroAudit {
  code: string;
  label: string;
  channel: string;
  archived: boolean;
  conversionRate: number;
  status: MacroAuditStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    archived: boolean,
    conversionRate: number,
    status: MacroAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.archived = archived;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: MacroAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): MacroAudit {
    return new MacroAudit(this.code, this.label, this.channel, this.archived, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a macro audit in status requested. */
export function newMacroAudit(code: string, label: string): MacroAudit {
  return new MacroAudit(code, label, "", false, 0, "requested");
}
