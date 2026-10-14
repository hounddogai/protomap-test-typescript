import * as text from "../../../../kit/text.js";

/** Where a path proposal is in its life cycle. */
export type PathProposalStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A path proposal. Its code is unique within a tenant. */
export class PathProposal {
  code: string;
  name: string;
  graceDays: number;
  archived: boolean;
  locale: string;
  status: PathProposalStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    archived: boolean,
    locale: string,
    status: PathProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.archived = archived;
    this.locale = locale;
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

  canMoveTo(next: PathProposalStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): PathProposal {
    return new PathProposal(this.code, this.name, this.graceDays, this.archived, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a path proposal in status open. */
export function newPathProposal(code: string, name: string): PathProposal {
  return new PathProposal(code, name, 0, false, "", "open");
}
