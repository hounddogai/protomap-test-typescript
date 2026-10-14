import * as text from "../../../../kit/text.js";

/** Where a weighted domain bundle is in its life cycle. */
export type WeightedDomainBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted domain bundle. Its code is unique within a tenant. */
export class WeightedDomainBundle {
  code: string;
  title: string;
  journeyId: string;
  region: string;
  attempts: number;
  status: WeightedDomainBundleStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    region: string,
    attempts: number,
    status: WeightedDomainBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.region = region;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedDomainBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedDomainBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted domain bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): WeightedDomainBundle {
    return new WeightedDomainBundle(this.code, this.title, this.journeyId, this.region, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted domain bundle in status open. */
export function newWeightedDomainBundle(code: string, title: string): WeightedDomainBundle {
  return new WeightedDomainBundle(code, title, "", "", 0, "open");
}
