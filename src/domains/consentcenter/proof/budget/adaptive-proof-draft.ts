import * as text from "../../../../kit/text.js";

/** Where a adaptive proof draft is in its life cycle. */
export type AdaptiveProofDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive proof draft. Its code is unique within a tenant. */
export class AdaptiveProofDraft {
  code: string;
  name: string;
  ratio: number;
  label: string;
  archived: boolean;
  batchSize: number;
  status: AdaptiveProofDraftStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    label: string,
    archived: boolean,
    batchSize: number,
    status: AdaptiveProofDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.label = label;
    this.archived = archived;
    this.batchSize = batchSize;
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

  canMoveTo(next: AdaptiveProofDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: AdaptiveProofDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive proof draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.batchSize + this.ratio) * 100) / 100;
  }

  copy(): AdaptiveProofDraft {
    return new AdaptiveProofDraft(
      this.code,
      this.name,
      this.ratio,
      this.label,
      this.archived,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive proof draft in status draft. */
export function newAdaptiveProofDraft(code: string, name: string): AdaptiveProofDraft {
  return new AdaptiveProofDraft(code, name, 0, "", false, 0, "draft");
}
