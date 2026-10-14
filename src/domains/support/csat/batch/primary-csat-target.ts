import * as text from "../../../../kit/text.js";

/** Where a primary csat target is in its life cycle. */
export type PrimaryCsatTargetStatus = "created" | "validated" | "published" | "retired";

/** One primary csat target, with what the planners need to act on it. */
export class PrimaryCsatTarget {
  code: string;
  name: string;
  score: number;
  visible: boolean;
  variant: string;
  weight: number;
  endsAt: number;
  country: string;
  frequencyCap: number;
  status: PrimaryCsatTargetStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    visible: boolean,
    variant: string,
    weight: number,
    endsAt: number,
    country: string,
    frequencyCap: number,
    status: PrimaryCsatTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.visible = visible;
    this.variant = variant;
    this.weight = weight;
    this.endsAt = endsAt;
    this.country = country;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: PrimaryCsatTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryCsatTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary csat target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.endsAt - this.frequencyCap) * 100) / 100;
  }

  copy(): PrimaryCsatTarget {
    return new PrimaryCsatTarget(
      this.code,
      this.name,
      this.score,
      this.visible,
      this.variant,
      this.weight,
      this.endsAt,
      this.country,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary csat target in status created. */
export function newPrimaryCsatTarget(code: string, name: string): PrimaryCsatTarget {
  return new PrimaryCsatTarget(code, name, 0, false, "", 0, 0, "", 0, "created");
}
