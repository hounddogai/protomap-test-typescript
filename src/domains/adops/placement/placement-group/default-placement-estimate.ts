import * as text from "../../../../kit/text.js";

/** Where a default placement estimate is in its life cycle. */
export type DefaultPlacementEstimateStatus = "created" | "validated" | "published" | "retired";

/** A default placement estimate. Its code is unique within a tenant. */
export class DefaultPlacementEstimate {
  code: string;
  label: string;
  locale: string;
  score: number;
  updatedAt: number;
  status: DefaultPlacementEstimateStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    score: number,
    updatedAt: number,
    status: DefaultPlacementEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.score = score;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: DefaultPlacementEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPlacementEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default placement estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"default placement estimate"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.score - this.updatedAt) * 100) / 100;
  }

  copy(): DefaultPlacementEstimate {
    return new DefaultPlacementEstimate(this.code, this.label, this.locale, this.score, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default placement estimate in status created. */
export function newDefaultPlacementEstimate(code: string, label: string): DefaultPlacementEstimate {
  return new DefaultPlacementEstimate(code, label, "", 0, 0, "created");
}
