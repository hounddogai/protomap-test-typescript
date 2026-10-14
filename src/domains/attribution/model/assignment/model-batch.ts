import * as text from "../../../../kit/text.js";

/** Where a model batch is in its life cycle. */
export type ModelBatchStatus = "created" | "validated" | "published" | "retired";

/** The record of a model batch and its current status. */
export class ModelBatch {
  code: string;
  label: string;
  visible: boolean;
  score: number;
  unit: string;
  campaignRef: string;
  journeyId: string;
  expiresAt: number;
  status: ModelBatchStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    score: number,
    unit: string,
    campaignRef: string,
    journeyId: string,
    expiresAt: number,
    status: ModelBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.score = score;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"model batch"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.expiresAt - this.score) * 100) / 100;
  }

  copy(): ModelBatch {
    return new ModelBatch(
      this.code,
      this.label,
      this.visible,
      this.score,
      this.unit,
      this.campaignRef,
      this.journeyId,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a model batch in status created. */
export function newModelBatch(code: string, label: string): ModelBatch {
  return new ModelBatch(code, label, false, 0, "", "", "", 0, "created");
}
