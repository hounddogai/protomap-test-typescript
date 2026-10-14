import * as text from "../../../../kit/text.js";

/** Where a default activation proposal is in its life cycle. */
export type DefaultActivationProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A default activation proposal. Its code is unique within a tenant. */
export class DefaultActivationProposal {
  code: string;
  title: string;
  archived: boolean;
  region: string;
  cohort: string;
  clicks: number;
  ratio: number;
  status: DefaultActivationProposalStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    region: string,
    cohort: string,
    clicks: number,
    ratio: number,
    status: DefaultActivationProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.region = region;
    this.cohort = cohort;
    this.clicks = clicks;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultActivationProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultActivationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default activation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.ratio + this.clicks) * 100) / 100;
  }

  copy(): DefaultActivationProposal {
    return new DefaultActivationProposal(
      this.code,
      this.title,
      this.archived,
      this.region,
      this.cohort,
      this.clicks,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default activation proposal in status requested. */
export function newDefaultActivationProposal(code: string, title: string): DefaultActivationProposal {
  return new DefaultActivationProposal(code, title, false, "", "", 0, 0, "requested");
}
