import * as text from "../../../../kit/text.js";

/** Where a legacy escalation ledger is in its life cycle. */
export type LegacyEscalationLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One legacy escalation ledger, with what the planners need to act on it. */
export class LegacyEscalationLedger {
  code: string;
  label: string;
  score: number;
  source: string;
  ratio: number;
  version: number;
  durationMinutes: number;
  discount: number;
  active: boolean;
  status: LegacyEscalationLedgerStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    source: string,
    ratio: number,
    version: number,
    durationMinutes: number,
    discount: number,
    active: boolean,
    status: LegacyEscalationLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.source = source;
    this.ratio = ratio;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyEscalationLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyEscalationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy escalation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.version * this.ratio * 100) / 100;
  }

  copy(): LegacyEscalationLedger {
    return new LegacyEscalationLedger(
      this.code,
      this.label,
      this.score,
      this.source,
      this.ratio,
      this.version,
      this.durationMinutes,
      this.discount,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy escalation ledger in status draft. */
export function newLegacyEscalationLedger(code: string, label: string): LegacyEscalationLedger {
  return new LegacyEscalationLedger(code, label, 0, "", 0, 0, 0, 0, false, "draft");
}
