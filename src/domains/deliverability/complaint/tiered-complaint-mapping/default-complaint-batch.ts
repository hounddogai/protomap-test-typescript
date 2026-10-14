import * as text from "../../../../kit/text.js";

/** Where a default complaint batch is in its life cycle. */
export type DefaultComplaintBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One default complaint batch, with what the planners need to act on it. */
export class DefaultComplaintBatch {
  code: string;
  name: string;
  minimum: number;
  sequence: number;
  description: string;
  threshold: number;
  createdAt: number;
  locale: string;
  ceiling: number;
  label: string;
  status: DefaultComplaintBatchStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    sequence: number,
    description: string,
    threshold: number,
    createdAt: number,
    locale: string,
    ceiling: number,
    label: string,
    status: DefaultComplaintBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.sequence = sequence;
    this.description = description;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.locale = locale;
    this.ceiling = ceiling;
    this.label = label;
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

  canMoveTo(next: DefaultComplaintBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: DefaultComplaintBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default complaint batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.sequence + this.ceiling) * 100) / 100;
  }

  copy(): DefaultComplaintBatch {
    return new DefaultComplaintBatch(
      this.code,
      this.name,
      this.minimum,
      this.sequence,
      this.description,
      this.threshold,
      this.createdAt,
      this.locale,
      this.ceiling,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default complaint batch in status draft. */
export function newDefaultComplaintBatch(code: string, name: string): DefaultComplaintBatch {
  return new DefaultComplaintBatch(code, name, 0, 0, "", 0, 0, "", 0, "", "draft");
}
