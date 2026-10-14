import * as text from "../../../../kit/text.js";

/** Where a opt out request is in its life cycle. */
export type OptOutRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a opt out request and its current status. */
export class OptOutRequest {
  code: string;
  title: string;
  score: number;
  quantity: number;
  region: string;
  cost: number;
  status: OptOutRequestStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    quantity: number,
    region: string,
    cost: number,
    status: OptOutRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.quantity = quantity;
    this.region = region;
    this.cost = cost;
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

  canMoveTo(next: OptOutRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: OptOutRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round(this.quantity * this.cost * 100) / 100;
  }

  copy(): OptOutRequest {
    return new OptOutRequest(this.code, this.title, this.score, this.quantity, this.region, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out request in status open. */
export function newOptOutRequest(code: string, title: string): OptOutRequest {
  return new OptOutRequest(code, title, 0, 0, "", 0, "open");
}
