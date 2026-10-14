import * as text from "../../../../kit/text.js";

/** Where a deflection estimate is in its life cycle. */
export type DeflectionEstimateStatus = "created" | "validated" | "published" | "retired";

/** A deflection estimate as the deflection team keeps it. */
export class DeflectionEstimate {
  code: string;
  label: string;
  title: string;
  retries: number;
  visible: boolean;
  endsAt: number;
  status: DeflectionEstimateStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    retries: number,
    visible: boolean,
    endsAt: number,
    status: DeflectionEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.retries = retries;
    this.visible = visible;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DeflectionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round(this.endsAt * this.retries * 100) / 100;
  }

  copy(): DeflectionEstimate {
    return new DeflectionEstimate(
      this.code,
      this.label,
      this.title,
      this.retries,
      this.visible,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a deflection estimate in status created. */
export function newDeflectionEstimate(code: string, label: string): DeflectionEstimate {
  return new DeflectionEstimate(code, label, "", 0, false, 0, "created");
}
