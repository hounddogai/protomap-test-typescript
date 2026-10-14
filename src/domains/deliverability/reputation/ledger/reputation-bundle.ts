import * as text from "../../../../kit/text.js";

/** Where a reputation bundle is in its life cycle. */
export type ReputationBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One reputation bundle, with what the planners need to act on it. */
export class ReputationBundle {
  code: string;
  label: string;
  journeyId: string;
  contactEmail: string;
  revision: number;
  status: ReputationBundleStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    contactEmail: string,
    revision: number,
    status: ReputationBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.revision = revision;
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

  canMoveTo(next: ReputationBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ReputationBundle {
    return new ReputationBundle(this.code, this.label, this.journeyId, this.contactEmail, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation bundle in status draft. */
export function newReputationBundle(code: string, label: string): ReputationBundle {
  return new ReputationBundle(code, label, "", "", 0, "draft");
}
