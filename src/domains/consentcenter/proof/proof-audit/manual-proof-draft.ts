import * as text from "../../../../kit/text.js";

/** Where a manual proof draft is in its life cycle. */
export type ManualProofDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual proof draft. Its code is unique within a tenant. */
export class ManualProofDraft {
  code: string;
  label: string;
  archived: boolean;
  revision: number;
  attributes: Map<string, string>;
  status: ManualProofDraftStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    revision: number,
    attributes: Map<string, string>,
    status: ManualProofDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.revision = revision;
    this.attributes = attributes;
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

  canMoveTo(next: ManualProofDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualProofDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual proof draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ManualProofDraft {
    return new ManualProofDraft(this.code, this.label, this.archived, this.revision, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual proof draft in status idle. */
export function newManualProofDraft(code: string, label: string): ManualProofDraft {
  return new ManualProofDraft(code, label, false, 0, new Map<string, string>(), "idle");
}
