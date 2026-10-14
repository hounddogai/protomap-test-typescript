import * as text from "../../../../kit/text.js";

/** Where a global suppression agreement is in its life cycle. */
export type GlobalSuppressionAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a global suppression agreement and its current status. */
export class GlobalSuppressionAgreement {
  code: string;
  name: string;
  pinned: boolean;
  clicks: number;
  title: string;
  journeyId: string;
  cost: number;
  status: GlobalSuppressionAgreementStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    clicks: number,
    title: string,
    journeyId: string,
    cost: number,
    status: GlobalSuppressionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.clicks = clicks;
    this.title = title;
    this.journeyId = journeyId;
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

  canMoveTo(next: GlobalSuppressionAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: GlobalSuppressionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.cost - this.clicks) * 100) / 100;
  }

  copy(): GlobalSuppressionAgreement {
    return new GlobalSuppressionAgreement(
      this.code,
      this.name,
      this.pinned,
      this.clicks,
      this.title,
      this.journeyId,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global suppression agreement in status open. */
export function newGlobalSuppressionAgreement(code: string, name: string): GlobalSuppressionAgreement {
  return new GlobalSuppressionAgreement(code, name, false, 0, "", "", 0, "open");
}
