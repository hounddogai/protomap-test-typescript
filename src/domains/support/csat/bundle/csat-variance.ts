import * as text from "../../../../kit/text.js";

/** Where a csat variance is in its life cycle. */
export type CsatVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One csat variance, with what the planners need to act on it. */
export class CsatVariance {
  code: string;
  label: string;
  createdAt: number;
  tags: string[];
  margin: number;
  variant: string;
  status: CsatVarianceStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    tags: string[],
    margin: number,
    variant: string,
    status: CsatVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.tags = tags;
    this.margin = margin;
    this.variant = variant;
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

  canMoveTo(next: CsatVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: CsatVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.createdAt * this.margin * 100) / 100;
  }

  copy(): CsatVariance {
    return new CsatVariance(this.code, this.label, this.createdAt, this.tags, this.margin, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a csat variance in status proposed. */
export function newCsatVariance(code: string, label: string): CsatVariance {
  return new CsatVariance(code, label, 0, [], 0, "", "proposed");
}
