import * as text from "../../../../kit/text.js";

/** Where a legacy deflection ledger is in its life cycle. */
export type LegacyDeflectionLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy deflection ledger. Its code is unique within a tenant. */
export class LegacyDeflectionLedger {
  code: string;
  label: string;
  margin: number;
  title: string;
  durationMinutes: number;
  status: LegacyDeflectionLedgerStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    title: string,
    durationMinutes: number,
    status: LegacyDeflectionLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.title = title;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: LegacyDeflectionLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
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

  moveTo(next: LegacyDeflectionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy deflection ledger"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.margin - this.durationMinutes) * 100) / 100;
  }

  copy(): LegacyDeflectionLedger {
    return new LegacyDeflectionLedger(
      this.code,
      this.label,
      this.margin,
      this.title,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy deflection ledger in status requested. */
export function newLegacyDeflectionLedger(code: string, label: string): LegacyDeflectionLedger {
  return new LegacyDeflectionLedger(code, label, 0, "", 0, "requested");
}
