import * as text from "../../../../kit/text.js";

/** Where a branch agreement is in its life cycle. */
export type BranchAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A branch agreement. Its code is unique within a tenant. */
export class BranchAgreement {
  code: string;
  title: string;
  region: string;
  unit: string;
  campaignRef: string;
  score: number;
  status: BranchAgreementStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    unit: string,
    campaignRef: string,
    score: number,
    status: BranchAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BranchAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BranchAgreement {
    return new BranchAgreement(
      this.code,
      this.title,
      this.region,
      this.unit,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a branch agreement in status idle. */
export function newBranchAgreement(code: string, title: string): BranchAgreement {
  return new BranchAgreement(code, title, "", "", "", 0, "idle");
}
