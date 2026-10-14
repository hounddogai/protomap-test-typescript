import * as text from "../../../../kit/text.js";

/** Where a macro quota is in its life cycle. */
export type MacroQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro quota. Its code is unique within a tenant. */
export class MacroQuota {
  code: string;
  name: string;
  retries: number;
  margin: number;
  journeyId: string;
  status: MacroQuotaStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    margin: number,
    journeyId: string,
    status: MacroQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.margin = margin;
    this.journeyId = journeyId;
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

  canMoveTo(next: MacroQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: MacroQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"macro quota"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.margin - this.retries) * 100) / 100;
  }

  copy(): MacroQuota {
    return new MacroQuota(this.code, this.name, this.retries, this.margin, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a macro quota in status requested. */
export function newMacroQuota(code: string, name: string): MacroQuota {
  return new MacroQuota(code, name, 0, 0, "", "requested");
}
