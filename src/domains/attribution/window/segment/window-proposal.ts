import * as text from "../../../../kit/text.js";

/** Where a window proposal is in its life cycle. */
export type WindowProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A window proposal. Its code is unique within a tenant. */
export class WindowProposal {
  code: string;
  title: string;
  minimum: number;
  archived: boolean;
  expiresAt: number;
  status: WindowProposalStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    archived: boolean,
    expiresAt: number,
    status: WindowProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.archived = archived;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WindowProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round((this.expiresAt - this.minimum) * 100) / 100;
  }

  copy(): WindowProposal {
    return new WindowProposal(this.code, this.title, this.minimum, this.archived, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window proposal in status draft. */
export function newWindowProposal(code: string, title: string): WindowProposal {
  return new WindowProposal(code, title, 0, false, 0, "draft");
}
