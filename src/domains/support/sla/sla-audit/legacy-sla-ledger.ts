import * as text from "../../../../kit/text.js";

/** Where a legacy sla ledger is in its life cycle. */
export type LegacySlaLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy sla ledger as the sla team keeps it. */
export class LegacySlaLedger {
  code: string;
  name: string;
  ownerId: string;
  sequence: number;
  ratio: number;
  active: boolean;
  label: string;
  channel: string;
  variant: string;
  revision: number;
  journeyId: string;
  status: LegacySlaLedgerStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    sequence: number,
    ratio: number,
    active: boolean,
    label: string,
    channel: string,
    variant: string,
    revision: number,
    journeyId: string,
    status: LegacySlaLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.sequence = sequence;
    this.ratio = ratio;
    this.active = active;
    this.label = label;
    this.channel = channel;
    this.variant = variant;
    this.revision = revision;
    this.journeyId = journeyId;
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

  canMoveTo(next: LegacySlaLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacySlaLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sla ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"legacy sla ledger"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.revision * this.ratio * 100) / 100;
  }

  copy(): LegacySlaLedger {
    return new LegacySlaLedger(
      this.code,
      this.name,
      this.ownerId,
      this.sequence,
      this.ratio,
      this.active,
      this.label,
      this.channel,
      this.variant,
      this.revision,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy sla ledger in status proposed. */
export function newLegacySlaLedger(code: string, name: string): LegacySlaLedger {
  return new LegacySlaLedger(code, name, "", 0, 0, false, "", "", "", 0, "", "proposed");
}
