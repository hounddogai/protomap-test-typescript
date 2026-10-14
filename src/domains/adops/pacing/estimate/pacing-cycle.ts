import * as text from "../../../../kit/text.js";

/** Where a pacing cycle is in its life cycle. */
export type PacingCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pacing cycle as the pacing team keeps it. */
export class PacingCycle {
  code: string;
  name: string;
  label: string;
  conversionRate: number;
  ratio: number;
  score: number;
  revision: number;
  active: boolean;
  maximum: number;
  locale: string;
  status: PacingCycleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    conversionRate: number,
    ratio: number,
    score: number,
    revision: number,
    active: boolean,
    maximum: number,
    locale: string,
    status: PacingCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
    this.score = score;
    this.revision = revision;
    this.active = active;
    this.maximum = maximum;
    this.locale = locale;
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

  canMoveTo(next: PacingCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PacingCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.ratio * this.conversionRate * 100) / 100;
  }

  copy(): PacingCycle {
    return new PacingCycle(
      this.code,
      this.name,
      this.label,
      this.conversionRate,
      this.ratio,
      this.score,
      this.revision,
      this.active,
      this.maximum,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pacing cycle in status draft. */
export function newPacingCycle(code: string, name: string): PacingCycle {
  return new PacingCycle(code, name, "", 0, 0, 0, 0, false, 0, "", "draft");
}
