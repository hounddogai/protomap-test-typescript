import * as text from "../../../../kit/text.js";

/** Where a model draft is in its life cycle. */
export type ModelDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A model draft as the model team keeps it. */
export class ModelDraft {
  code: string;
  title: string;
  margin: number;
  variant: string;
  region: string;
  externalRef: string;
  status: ModelDraftStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    variant: string,
    region: string,
    externalRef: string,
    status: ModelDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.variant = variant;
    this.region = region;
    this.externalRef = externalRef;
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

  canMoveTo(next: ModelDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): ModelDraft {
    return new ModelDraft(this.code, this.title, this.margin, this.variant, this.region, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a model draft in status proposed. */
export function newModelDraft(code: string, title: string): ModelDraft {
  return new ModelDraft(code, title, 0, "", "", "", "proposed");
}
