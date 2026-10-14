import * as text from "../../../../kit/text.js";

/** Where a creative rollup is in its life cycle. */
export type CreativeRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A creative rollup as the creative team keeps it. */
export class CreativeRollup {
  code: string;
  title: string;
  label: string;
  durationMinutes: number;
  ceiling: number;
  journeyId: string;
  discount: number;
  source: string;
  status: CreativeRollupStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    durationMinutes: number,
    ceiling: number,
    journeyId: string,
    discount: number,
    source: string,
    status: CreativeRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.ceiling = ceiling;
    this.journeyId = journeyId;
    this.discount = discount;
    this.source = source;
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

  canMoveTo(next: CreativeRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round(this.durationMinutes * this.ceiling * 100) / 100;
  }

  copy(): CreativeRollup {
    return new CreativeRollup(
      this.code,
      this.title,
      this.label,
      this.durationMinutes,
      this.ceiling,
      this.journeyId,
      this.discount,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a creative rollup in status proposed. */
export function newCreativeRollup(code: string, title: string): CreativeRollup {
  return new CreativeRollup(code, title, "", 0, 0, "", 0, "", "proposed");
}
