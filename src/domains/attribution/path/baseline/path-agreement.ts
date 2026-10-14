import * as text from "../../../../kit/text.js";

/** Where a path agreement is in its life cycle. */
export type PathAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A path agreement as the path team keeps it. */
export class PathAgreement {
  code: string;
  title: string;
  campaignRef: string;
  pinned: boolean;
  reviewer: string;
  cost: number;
  region: string;
  status: PathAgreementStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    pinned: boolean,
    reviewer: string,
    cost: number,
    region: string,
    status: PathAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.cost = cost;
    this.region = region;
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

  canMoveTo(next: PathAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: PathAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): PathAgreement {
    return new PathAgreement(
      this.code,
      this.title,
      this.campaignRef,
      this.pinned,
      this.reviewer,
      this.cost,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a path agreement in status proposed. */
export function newPathAgreement(code: string, title: string): PathAgreement {
  return new PathAgreement(code, title, "", false, "", 0, "", "proposed");
}
