import * as text from "../../../../kit/text.js";

/** Where a invite rollup is in its life cycle. */
export type InviteRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite rollup. Its code is unique within a tenant. */
export class InviteRollup {
  code: string;
  label: string;
  currency: string;
  segment: string;
  margin: number;
  graceDays: number;
  journeyId: string;
  source: string;
  status: InviteRollupStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    segment: string,
    margin: number,
    graceDays: number,
    journeyId: string,
    source: string,
    status: InviteRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.segment = segment;
    this.margin = margin;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.source = source;
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

  canMoveTo(next: InviteRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: InviteRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"invite rollup"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.margin * this.graceDays * 100) / 100;
  }

  copy(): InviteRollup {
    return new InviteRollup(
      this.code,
      this.label,
      this.currency,
      this.segment,
      this.margin,
      this.graceDays,
      this.journeyId,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite rollup in status new. */
export function newInviteRollup(code: string, label: string): InviteRollup {
  return new InviteRollup(code, label, "", "", 0, 0, "", "", "new");
}
