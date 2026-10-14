import * as text from "../../../../kit/text.js";

/** Where a seasonal macro request is in its life cycle. */
export type SeasonalMacroRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal macro request, with what the planners need to act on it. */
export class SeasonalMacroRequest {
  code: string;
  name: string;
  updatedAt: number;
  variant: string;
  currency: string;
  status: SeasonalMacroRequestStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    variant: string,
    currency: string,
    status: SeasonalMacroRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.currency = currency;
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

  canMoveTo(next: SeasonalMacroRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalMacroRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal macro request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): SeasonalMacroRequest {
    return new SeasonalMacroRequest(this.code, this.name, this.updatedAt, this.variant, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal macro request in status open. */
export function newSeasonalMacroRequest(code: string, name: string): SeasonalMacroRequest {
  return new SeasonalMacroRequest(code, name, 0, "", "", "open");
}
