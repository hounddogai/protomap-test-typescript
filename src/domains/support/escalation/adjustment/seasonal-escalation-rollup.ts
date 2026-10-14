import * as text from "../../../../kit/text.js";

/** Where a seasonal escalation rollup is in its life cycle. */
export type SeasonalEscalationRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal escalation rollup. Its code is unique within a tenant. */
export class SeasonalEscalationRollup {
  code: string;
  title: string;
  currency: string;
  version: number;
  sendAt: number;
  windowDays: number;
  sequence: number;
  active: boolean;
  threshold: number;
  status: SeasonalEscalationRollupStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    version: number,
    sendAt: number,
    windowDays: number,
    sequence: number,
    active: boolean,
    threshold: number,
    status: SeasonalEscalationRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.version = version;
    this.sendAt = sendAt;
    this.windowDays = windowDays;
    this.sequence = sequence;
    this.active = active;
    this.threshold = threshold;
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

  canMoveTo(next: SeasonalEscalationRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalEscalationRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal escalation rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"seasonal escalation rollup"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.windowDays - this.version) * 100) / 100;
  }

  copy(): SeasonalEscalationRollup {
    return new SeasonalEscalationRollup(
      this.code,
      this.title,
      this.currency,
      this.version,
      this.sendAt,
      this.windowDays,
      this.sequence,
      this.active,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal escalation rollup in status proposed. */
export function newSeasonalEscalationRollup(code: string, title: string): SeasonalEscalationRollup {
  return new SeasonalEscalationRollup(code, title, "", 0, 0, 0, 0, false, 0, "proposed");
}
