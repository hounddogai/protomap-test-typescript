import * as text from "../../../../kit/text.js";

/** Where a step ledger is in its life cycle. */
export type StepLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One step ledger, with what the planners need to act on it. */
export class StepLedger {
  code: string;
  name: string;
  weight: number;
  pinned: boolean;
  ratio: number;
  maximum: number;
  utmSource: string;
  visible: boolean;
  status: StepLedgerStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    pinned: boolean,
    ratio: number,
    maximum: number,
    utmSource: string,
    visible: boolean,
    status: StepLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.pinned = pinned;
    this.ratio = ratio;
    this.maximum = maximum;
    this.utmSource = utmSource;
    this.visible = visible;
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

  canMoveTo(next: StepLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.maximum) * 100) / 100;
  }

  copy(): StepLedger {
    return new StepLedger(
      this.code,
      this.name,
      this.weight,
      this.pinned,
      this.ratio,
      this.maximum,
      this.utmSource,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a step ledger in status draft. */
export function newStepLedger(code: string, name: string): StepLedger {
  return new StepLedger(code, name, 0, false, 0, 0, "", false, "draft");
}
