import * as text from "../../../../kit/text.js";

/** Where a pending challenge template is in its life cycle. */
export type PendingChallengeTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending challenge template. Its code is unique within a tenant. */
export class PendingChallengeTemplate {
  code: string;
  name: string;
  ownerId: string;
  segment: string;
  retries: number;
  status: PendingChallengeTemplateStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    segment: string,
    retries: number,
    status: PendingChallengeTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.segment = segment;
    this.retries = retries;
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

  canMoveTo(next: PendingChallengeTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingChallengeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending challenge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): PendingChallengeTemplate {
    return new PendingChallengeTemplate(this.code, this.name, this.ownerId, this.segment, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending challenge template in status proposed. */
export function newPendingChallengeTemplate(code: string, name: string): PendingChallengeTemplate {
  return new PendingChallengeTemplate(code, name, "", "", 0, "proposed");
}
