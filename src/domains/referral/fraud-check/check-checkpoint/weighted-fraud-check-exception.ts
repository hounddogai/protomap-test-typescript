import * as text from "../../../../kit/text.js";

/** Where a weighted fraud check exception is in its life cycle. */
export type WeightedFraudCheckExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a weighted fraud check exception and its current status. */
export class WeightedFraudCheckException {
  code: string;
  title: string;
  createdAt: number;
  tags: string[];
  margin: number;
  status: WeightedFraudCheckExceptionStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    tags: string[],
    margin: number,
    status: WeightedFraudCheckExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.tags = tags;
    this.margin = margin;
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

  canMoveTo(next: WeightedFraudCheckExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedFraudCheckExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted fraud check exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round((this.margin - this.createdAt) * 100) / 100;
  }

  copy(): WeightedFraudCheckException {
    return new WeightedFraudCheckException(this.code, this.title, this.createdAt, this.tags, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted fraud check exception in status proposed. */
export function newWeightedFraudCheckException(code: string, title: string): WeightedFraudCheckException {
  return new WeightedFraudCheckException(code, title, 0, [], 0, "proposed");
}
